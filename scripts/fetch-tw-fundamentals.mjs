#!/usr/bin/env node
/**
 * 台股基本面批次抓取腳本
 * 用法: node scripts/fetch-tw-fundamentals.mjs [--limit 50] [--skip-existing] [--batch 3] [--delay 2000]
 *
 * 建議排程: 每天晚上 22:00 執行（台股收盤後、Yahoo 數據更新後）
 *
 * 設計：
 * - 使用 Yahoo Finance quoteSummary API（2330.TW 格式）
 * - 每批 3 支，間隔 2 秒（避免封鎖）
 * - 支持斷點續傳（--skip-existing 跳過今天已抓的）
 * - 出錯不中斷，記錄失敗清單
 */
import { Pool } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '..', '.env.local') });

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36';

// ── 參數解析 ──
const args = process.argv.slice(2);
const getArg = (name, def) => { const i = args.indexOf(`--${name}`); return i >= 0 && args[i+1] ? args[i+1] : def; };
const LIMIT = parseInt(getArg('limit', '0'));       // 0 = 全部
const BATCH = parseInt(getArg('batch', '3'));         // 每批幾支
const DELAY = parseInt(getArg('delay', '2000'));      // 批次間隔 ms
const SKIP_EXISTING = args.includes('--skip-existing');
const ONLY_LISTED = args.includes('--only-listed');    // 只抓上市（排除 ETF/特殊）

// ── Yahoo Finance 認證（使用 fc.yahoo.com 輕量 cookie） ──
let cachedCookies = null, cachedCrumb = null, crumbTime = 0;
let crumbPromise = null;
const CRUMB_TTL = 10 * 60 * 1000;

async function ensureCrumb() {
  if (cachedCrumb && Date.now() - crumbTime < CRUMB_TTL) return;
  if (crumbPromise) { await crumbPromise; return; }
  crumbPromise = (async () => {
    console.log('🔑 取得 Yahoo Finance crumb...');
    const r1 = await fetch('https://fc.yahoo.com/', {
      headers: { 'User-Agent': UA }, redirect: 'manual',
    });
    const rawCookies = r1.headers.getSetCookie ? r1.headers.getSetCookie() : [];
    cachedCookies = rawCookies.map(c => c.split(';')[0]).join('; ');
    const r2 = await fetch('https://query2.finance.yahoo.com/v1/test/getcrumb', {
      headers: { 'User-Agent': UA, Cookie: cachedCookies },
    });
    if (!r2.ok) throw new Error(`crumb HTTP ${r2.status}`);
    cachedCrumb = (await r2.text()).trim();
    if (!cachedCrumb || cachedCrumb.includes('<')) throw new Error('invalid crumb');
    crumbTime = Date.now();
    console.log(`✅ crumb: ${cachedCrumb.substring(0, 10)}...`);
  })();
  try { await crumbPromise; } finally { crumbPromise = null; }
}

async function fetchFundamentals(symbol) {
  await ensureCrumb();
  const ticker = `${symbol}.TW`;
  const url = `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${ticker}?modules=defaultKeyStatistics,summaryDetail,assetProfile,financialData,earningsTrend&crumb=${encodeURIComponent(cachedCrumb)}`;
  const resp = await fetch(url, {
    headers: { 'User-Agent': UA, Accept: 'application/json', Cookie: cachedCookies },
    signal: AbortSignal.timeout(10000),
  });
  if (resp.status === 401 || resp.status === 403) {
    cachedCrumb = null;
    throw new Error(`AUTH_${resp.status}`);
  }
  if (!resp.ok) throw new Error(`HTTP_${resp.status}`);
  const data = await resp.json();
  const r = data?.quoteSummary?.result?.[0];
  if (!r) throw new Error('NO_DATA');
  return r;
}

function extractFields(r) {
  const ks = r.defaultKeyStatistics || {};
  const sd = r.summaryDetail || {};
  const ap = r.assetProfile || {};
  const fd = r.financialData || {};
  const et = r.earningsTrend || {};
  const fwdPE = ks.forwardPE?.raw ?? sd.forwardPE?.raw ?? null;
  const g = et.trend?.find(t => t.period === '+1y')?.growth?.raw ?? null;
  const gPct = g != null ? parseFloat((g * 100).toFixed(1)) : null;
  // PEG: 優先用 Yahoo 提供的，否則用 fwdPE / growth 計算
  let peg = ks.pegRatio?.raw ?? null;
  if (!peg && fwdPE && gPct && gPct > 0) peg = parseFloat((fwdPE / gPct).toFixed(3));
  return {
    pe_ttm: ks.trailingPE?.raw ?? sd.trailingPE?.raw ?? null,
    pe_fwd: fwdPE,
    peg, peg_growth_used: gPct,
    gross_margin: fd.grossMargins?.raw ?? null,
    operating_margin: fd.operatingMargins?.raw ?? null,
    net_margin: fd.profitMargins?.raw ?? null,
    rev_growth: fd.revenueGrowth?.raw ?? null,
    eps_growth: fd.earningsGrowth?.raw ?? null,
    analyst_target: fd.targetMeanPrice?.raw ?? null,
    analyst_low: fd.targetLowPrice?.raw ?? null,
    analyst_high: fd.targetHighPrice?.raw ?? null,
    analyst_count: fd.numberOfAnalystOpinions?.raw ?? null,
    recommendation: fd.recommendationKey ?? null,
    market_cap: ks.marketCap?.raw ?? sd.marketCap?.raw ?? null,
    beta: ks.beta?.raw ?? sd.beta?.raw ?? null,
    dividend_yield: sd.dividendYield?.raw ?? null,
    free_cashflow: fd.freeCashflow?.raw ?? null,
    sector: ap.sector ?? null,
    industry: ap.industry ?? null,
  };
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

// ══════════ MAIN ══════════
async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: true });
  const client = await pool.connect();

  try {
    // 取得所有台股代號
    let query = 'SELECT symbol FROM tw_stocks ORDER BY symbol';
    const { rows: allStocks } = await client.query(query);
    let symbols = allStocks.map(r => r.symbol);
    console.log(`📋 資料庫共 ${symbols.length} 支台股`);

    // 跳過已抓取的
    if (SKIP_EXISTING) {
      const { rows: done } = await client.query(
        `SELECT symbol FROM tw_fundamentals WHERE update_date = CURRENT_DATE`
      );
      const doneSet = new Set(done.map(r => r.symbol));
      symbols = symbols.filter(s => !doneSet.has(s));
      console.log(`⏭️  今天已抓 ${done.length} 支，剩餘 ${symbols.length} 支`);
    }

    // 過濾純數字代碼（上市公司，排除特殊標的）
    if (ONLY_LISTED) {
      symbols = symbols.filter(s => /^\d{4}$/.test(s));
      console.log(`🏢 僅上市公司（4碼）: ${symbols.length} 支`);
    }

    if (LIMIT > 0) symbols = symbols.slice(0, LIMIT);
    console.log(`🚀 開始抓取 ${symbols.length} 支 · 批次 ${BATCH} · 間隔 ${DELAY}ms\n`);

    let success = 0, fail = 0, noData = 0;
    const failed = [];
    const t0 = Date.now();

    // UPSERT SQL
    const upsertSQL = `
      INSERT INTO tw_fundamentals (
        symbol, update_date, pe_ttm, pe_fwd, peg, peg_growth_used,
        gross_margin, operating_margin, net_margin, rev_growth, eps_growth,
        analyst_target, analyst_low, analyst_high, analyst_count, recommendation,
        market_cap, beta, dividend_yield, free_cashflow, sector, industry, fetched_at
      ) VALUES (
        $1, CURRENT_DATE, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, NOW()
      )
      ON CONFLICT (symbol, update_date) DO UPDATE SET
        pe_ttm=$2, pe_fwd=$3, peg=$4, peg_growth_used=$5,
        gross_margin=$6, operating_margin=$7, net_margin=$8,
        rev_growth=$9, eps_growth=$10,
        analyst_target=$11, analyst_low=$12, analyst_high=$13,
        analyst_count=$14, recommendation=$15,
        market_cap=$16, beta=$17, dividend_yield=$18, free_cashflow=$19,
        sector=$20, industry=$21, fetched_at=NOW()
    `;

    for (let i = 0; i < symbols.length; i += BATCH) {
      const batch = symbols.slice(i, i + BATCH);
      const results = await Promise.allSettled(
        batch.map(async sym => {
          try {
            const raw = await fetchFundamentals(sym);
            const f = extractFields(raw);
            // 檢查是否有任何有意義的數據
            const hasData = f.pe_ttm || f.peg || f.gross_margin || f.analyst_target;
            if (!hasData) { noData++; return { sym, status: 'no_data' }; }
            await client.query(upsertSQL, [
              sym, f.pe_ttm, f.pe_fwd, f.peg, f.peg_growth_used,
              f.gross_margin, f.operating_margin, f.net_margin,
              f.rev_growth, f.eps_growth,
              f.analyst_target, f.analyst_low, f.analyst_high,
              f.analyst_count, f.recommendation,
              f.market_cap, f.beta, f.dividend_yield, f.free_cashflow,
              f.sector, f.industry,
            ]);
            success++;
            return { sym, status: 'ok', peg: f.peg, pe: f.pe_ttm, gm: f.gross_margin };
          } catch (e) {
            fail++;
            failed.push({ sym, error: e.message });
            return { sym, status: 'fail', error: e.message };
          }
        })
      );

      // 進度報告
      const done = Math.min(i + BATCH, symbols.length);
      const elapsed = ((Date.now() - t0) / 1000).toFixed(0);
      const eta = symbols.length > done ? ((Date.now() - t0) / done * (symbols.length - done) / 1000 / 60).toFixed(1) : 0;
      const batchInfo = results.map(r => {
        const v = r.value || {};
        return v.status === 'ok' ? `✅${v.sym}` : v.status === 'no_data' ? `⬜${v.sym}` : `❌${v.sym}`;
      }).join(' ');
      console.log(`[${done}/${symbols.length}] ${elapsed}s ETA ${eta}min | ${batchInfo} | ✅${success} ❌${fail} ⬜${noData}`);

      if (i + BATCH < symbols.length) await sleep(DELAY);
    }

    // 總結
    const totalTime = ((Date.now() - t0) / 1000 / 60).toFixed(1);
    console.log(`\n════════════════════════════════`);
    console.log(`📊 抓取完成！耗時 ${totalTime} 分鐘`);
    console.log(`✅ 成功: ${success}  ❌ 失敗: ${fail}  ⬜ 無數據: ${noData}`);

    // 統計有多少有 PEG / 分析師目標
    const stats = await client.query(`
      SELECT
        COUNT(*) AS total,
        COUNT(peg) AS has_peg,
        COUNT(analyst_target) AS has_target,
        COUNT(gross_margin) AS has_gm,
        COUNT(pe_ttm) AS has_pe
      FROM tw_fundamentals WHERE update_date = CURRENT_DATE
    `);
    const st = stats.rows[0];
    console.log(`\n📦 今日數據: ${st.total} 支`);
    console.log(`  PE: ${st.has_pe} | PEG: ${st.has_peg} | 毛利率: ${st.has_gm} | 分析師目標: ${st.has_target}`);

    if (failed.length > 0 && failed.length <= 20) {
      console.log('\n❌ 失敗清單:');
      failed.forEach(f => console.log(`  ${f.sym}: ${f.error}`));
    }
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(e => { console.error('💥 Fatal:', e); process.exit(1); });
