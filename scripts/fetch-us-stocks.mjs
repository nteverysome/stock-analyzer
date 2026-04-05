#!/usr/bin/env node
/**
 * 美股完整數據抓取管道（3合1）
 * Step 1: 抓取美股清單（Yahoo Screener → us_stocks）
 * Step 2: 抓取基本面（Yahoo quoteSummary → us_fundamentals）
 * Step 3: 抓取價格+計算技術指標（Yahoo chart → us_daily_prices + us_indicators）
 *
 * 用法: node scripts/fetch-us-stocks.mjs [--step 1|2|3|all] [--limit N] [--skip-existing]
 */
import { Pool } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36';
const args = process.argv.slice(2);
const getArg = (n, d) => { const i = args.indexOf(`--${n}`); return i >= 0 && args[i+1] ? args[i+1] : d; };
const STEP = getArg('step', 'all');
const LIMIT = parseInt(getArg('limit', '0'));
const SKIP = args.includes('--skip-existing');
const DELAY = parseInt(getArg('delay', '1500'));
const sleep = ms => new Promise(r => setTimeout(r, ms));

// ── Yahoo crumb auth ──
let cookies = null, crumb = null, crumbTime = 0, crumbLock = null;
async function ensureCrumb() {
  if (crumb && Date.now() - crumbTime < 600000) return;
  if (crumbLock) { await crumbLock; return; }
  crumbLock = (async () => {
    const r1 = await fetch('https://fc.yahoo.com/', { headers: { 'User-Agent': UA }, redirect: 'manual' });
    cookies = (r1.headers.getSetCookie ? r1.headers.getSetCookie() : []).map(c => c.split(';')[0]).join('; ');
    const r2 = await fetch('https://query2.finance.yahoo.com/v1/test/getcrumb', {
      headers: { 'User-Agent': UA, Cookie: cookies },
    });
    crumb = (await r2.text()).trim();
    if (!crumb || crumb.includes('<')) throw new Error('crumb failed');
    crumbTime = Date.now();
    console.log(`🔑 crumb OK`);
  })();
  try { await crumbLock; } finally { crumbLock = null; }
}

async function yahooAPI(path) {
  await ensureCrumb();
  const url = `https://query2.finance.yahoo.com${path}${path.includes('?') ? '&' : '?'}crumb=${encodeURIComponent(crumb)}`;
  const r = await fetch(url, {
    headers: { 'User-Agent': UA, Cookie: cookies, Accept: 'application/json' },
    signal: AbortSignal.timeout(15000),
  });
  if (r.status === 401 || r.status === 403) { crumb = null; throw new Error(`AUTH_${r.status}`); }
  if (!r.ok) throw new Error(`HTTP_${r.status}`);
  return r.json();
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: true });
const client = await pool.connect();

// ═══════ STEP 1: 美股清單 ═══════
async function step1_fetchStockList() {
  console.log('\n═══ Step 1: 抓取美股清單 ═══');
  await ensureCrumb();
  const allSymbols = new Map();
  // Yahoo predefined screeners
  const screens = ['most_actives', 'day_gainers', 'day_losers', 'undervalued_large_caps',
    'growth_technology_stocks', 'undervalued_growth_stocks', 'small_cap_gainers'];
  for (const screen of screens) {
    try {
      const data = await yahooAPI(`/v1/finance/screener/predefined/saved?scrIds=${screen}&count=250`);
      const quotes = data?.finance?.result?.[0]?.quotes || [];
      quotes.forEach(q => { if (q.symbol && !q.symbol.includes('.')) allSymbols.set(q.symbol, q); });
      console.log(`  ${screen}: ${quotes.length} (累計 ${allSymbols.size})`);
      await sleep(800);
    } catch(e) { console.log(`  ${screen}: ❌ ${e.message}`); }
  }
  // Trending
  try {
    const data = await yahooAPI('/v1/finance/trending/US?count=50');
    const quotes = data?.finance?.result?.[0]?.quotes || [];
    quotes.forEach(q => { if (q.symbol && !q.symbol.includes('.')) allSymbols.set(q.symbol, { symbol: q.symbol }); });
    console.log(`  trending: ${quotes.length} (累計 ${allSymbols.size})`);
  } catch(e) {}
  // S&P 500 核心成分股（確保覆蓋）
  const sp500core = ['AAPL','MSFT','AMZN','NVDA','GOOGL','META','TSLA','BRK-B','UNH','JNJ',
    'V','XOM','JPM','PG','MA','HD','CVX','MRK','ABBV','LLY','PEP','KO','COST','AVGO','TMO',
    'MCD','WMT','CSCO','ACN','ABT','DHR','NEE','PM','TXN','UPS','MS','RTX','AMGN','HON','QCOM',
    'LOW','INTC','INTU','COP','BA','AMAT','DE','GS','BLK','ISRG','ADI','MDLZ','GILD','SYK',
    'ADP','SBUX','BKNG','LRCX','VRTX','REGN','PANW','MMC','CI','CB','PGR','TJX','NOW','SHW',
    'MO','PYPL','NFLX','AMD','CRM','ORCL','ADBE','DIS','UBER','ABNB','SNAP','RBLX','DKNG',
    'ZM','SQ','SHOP','PLTR','SOFI','RIVN','LCID','NIO','COIN','MARA','RIOT','ARM','SMCI'];
  sp500core.forEach(s => { if (!allSymbols.has(s)) allSymbols.set(s, { symbol: s }); });
  console.log(`  SP500核心: 補充至 ${allSymbols.size}`);

  // 寫入 DB
  let inserted = 0;
  for (const [sym, q] of allSymbols) {
    try {
      await client.query(`
        INSERT INTO us_stocks (symbol, name, sector, industry, market_cap, exchange)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (symbol) DO UPDATE SET
          name=COALESCE(EXCLUDED.name, us_stocks.name),
          sector=COALESCE(EXCLUDED.sector, us_stocks.sector),
          market_cap=COALESCE(EXCLUDED.market_cap, us_stocks.market_cap)
      `, [sym, q.shortName||q.longName||sym, q.sector||null, q.industry||null,
          q.marketCap||null, q.exchange||'NASDAQ']);
      inserted++;
    } catch(e) {}
  }
  console.log(`✅ us_stocks: ${inserted} 支寫入`);
  return allSymbols.size;
}

// ═══════ STEP 2: 基本面 ═══════
async function step2_fetchFundamentals() {
  console.log('\n═══ Step 2: 抓取美股基本面 ═══');
  let { rows: stocks } = await client.query('SELECT symbol FROM us_stocks ORDER BY symbol');
  let symbols = stocks.map(r => r.symbol);
  if (SKIP) {
    const { rows: done } = await client.query(`SELECT symbol FROM us_fundamentals WHERE update_date = CURRENT_DATE`);
    const doneSet = new Set(done.map(r => r.symbol));
    symbols = symbols.filter(s => !doneSet.has(s));
    console.log(`  跳過已抓: ${done.length}，剩 ${symbols.length}`);
  }
  if (LIMIT > 0) symbols = symbols.slice(0, LIMIT);
  console.log(`  開始抓取 ${symbols.length} 支基本面...`);

  const upsertSQL = `INSERT INTO us_fundamentals (symbol,update_date,pe_ttm,pe_fwd,peg,gross_margin,operating_margin,
    net_margin,rev_growth,eps_growth,analyst_target,analyst_low,analyst_high,analyst_count,recommendation,
    market_cap,beta,dividend_yield,free_cashflow,sector,industry,fetched_at)
    VALUES ($1,CURRENT_DATE,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,NOW())
    ON CONFLICT (symbol,update_date) DO UPDATE SET pe_ttm=$2,pe_fwd=$3,peg=$4,gross_margin=$5,
    operating_margin=$6,net_margin=$7,rev_growth=$8,eps_growth=$9,analyst_target=$10,analyst_low=$11,
    analyst_high=$12,analyst_count=$13,recommendation=$14,market_cap=$15,beta=$16,dividend_yield=$17,
    free_cashflow=$18,sector=$19,industry=$20,fetched_at=NOW()`;

  let ok = 0, fail = 0, noData = 0;
  for (let i = 0; i < symbols.length; i += 3) {
    const batch = symbols.slice(i, i + 3);
    await Promise.allSettled(batch.map(async sym => {
      try {
        const data = await yahooAPI(`/v10/finance/quoteSummary/${sym}?modules=defaultKeyStatistics,summaryDetail,assetProfile,financialData,earningsTrend`);
        const r = data?.quoteSummary?.result?.[0];
        if (!r) { noData++; return; }
        const ks = r.defaultKeyStatistics||{}, sd = r.summaryDetail||{}, fd = r.financialData||{}, ap = r.assetProfile||{};
        const et = r.earningsTrend||{};
        const fwdPE = ks.forwardPE?.raw ?? sd.forwardPE?.raw;
        const g = et.trend?.find(t=>t.period==='+1y')?.growth?.raw;
        let peg = ks.pegRatio?.raw ?? null;
        if (!peg && fwdPE && g && g > 0) peg = +(fwdPE / (g*100)).toFixed(3);
        const hasData = (ks.trailingPE?.raw || fd.grossMargins?.raw || fd.targetMeanPrice?.raw);
        if (!hasData) { noData++; return; }
        await client.query(upsertSQL, [sym,
          ks.trailingPE?.raw??sd.trailingPE?.raw, fwdPE, peg,
          fd.grossMargins?.raw, fd.operatingMargins?.raw, fd.profitMargins?.raw,
          fd.revenueGrowth?.raw, fd.earningsGrowth?.raw,
          fd.targetMeanPrice?.raw, fd.targetLowPrice?.raw, fd.targetHighPrice?.raw,
          fd.numberOfAnalystOpinions?.raw, fd.recommendationKey,
          ks.marketCap?.raw??sd.marketCap?.raw, ks.beta?.raw??sd.beta?.raw,
          sd.dividendYield?.raw, fd.freeCashflow?.raw, ap.sector, ap.industry,
        ]);
        ok++;
      } catch(e) { fail++; }
    }));
    if ((i % 30) === 0 || i + 3 >= symbols.length) {
      console.log(`  [${Math.min(i+3,symbols.length)}/${symbols.length}] ✅${ok} ❌${fail} ⬜${noData}`);
    }
    await sleep(DELAY);
  }
  console.log(`✅ 基本面完成: ${ok} 成功, ${fail} 失敗, ${noData} 無數據`);
}

// ═══════ STEP 3: 價格 + 技術指標 ═══════
async function step3_fetchPricesAndIndicators() {
  console.log('\n═══ Step 3: 抓取價格 & 計算技術指標 ═══');
  let { rows: stocks } = await client.query('SELECT symbol FROM us_stocks ORDER BY symbol');
  let symbols = stocks.map(r => r.symbol);
  if (SKIP) {
    const { rows: done } = await client.query(`SELECT DISTINCT symbol FROM us_indicators WHERE indicator_date >= CURRENT_DATE - 1`);
    const doneSet = new Set(done.map(r => r.symbol));
    symbols = symbols.filter(s => !doneSet.has(s));
    console.log(`  跳過已抓: ${done.length}，剩 ${symbols.length}`);
  }
  if (LIMIT > 0) symbols = symbols.slice(0, LIMIT);
  console.log(`  開始抓取 ${symbols.length} 支 1y 價格...`);

  let ok = 0, fail = 0;
  for (let i = 0; i < symbols.length; i += 2) {
    const batch = symbols.slice(i, i + 2);
    await Promise.allSettled(batch.map(async sym => {
      try {
        const data = await yahooAPI(`/v8/finance/chart/${sym}?interval=1d&range=1y`);
        const result = data?.chart?.result?.[0];
        if (!result) throw new Error('NO_CHART');
        const ts = result.timestamp || [];
        const q = result.indicators?.quote?.[0] || {};
        const closes = q.close || [], opens = q.open || [], highs = q.high || [], lows = q.low || [], vols = q.volume || [];
        if (closes.length < 20) throw new Error('TOO_FEW');

        // 寫入價格（最近 120 天）
        const recent = Math.max(0, ts.length - 120);
        for (let j = recent; j < ts.length; j++) {
          if (!closes[j]) continue;
          const d = new Date(ts[j] * 1000).toISOString().split('T')[0];
          await client.query(`INSERT INTO us_daily_prices (symbol,price_date,open,high,low,close,volume)
            VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT(symbol,price_date) DO UPDATE SET close=$6,high=$4,low=$5,volume=$7`,
            [sym, d, opens[j], highs[j], lows[j], closes[j], vols[j]]);
        }

        // 計算指標（用最後的數據）
        const c = closes.filter(v => v != null);
        const ind = computeIndicators(c, highs.filter(v=>v!=null), lows.filter(v=>v!=null));
        const lastDate = new Date(ts[ts.length - 1] * 1000).toISOString().split('T')[0];
        await client.query(`INSERT INTO us_indicators (symbol,indicator_date,rsi,kd_fast,kd_slow,macd,macd_signal,macd_histogram,ma5,ma10,ma20,ma60,ma120)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
          ON CONFLICT(symbol,indicator_date) DO UPDATE SET rsi=$3,kd_fast=$4,kd_slow=$5,macd=$6,macd_signal=$7,macd_histogram=$8,ma5=$9,ma10=$10,ma20=$11,ma60=$12,ma120=$13`,
          [sym, lastDate, ind.rsi, ind.kdK, ind.kdD, ind.macd, ind.macdSignal, ind.macdHist,
           ind.ma5, ind.ma10, ind.ma20, ind.ma60, ind.ma120]);
        ok++;
      } catch(e) { fail++; }
    }));
    if ((i % 20) === 0 || i + 2 >= symbols.length) {
      console.log(`  [${Math.min(i+2,symbols.length)}/${symbols.length}] ✅${ok} ❌${fail}`);
    }
    await sleep(DELAY);
  }
  console.log(`✅ 價格+指標完成: ${ok} 成功, ${fail} 失敗`);
}

// 技術指標計算
function computeIndicators(closes, highs, lows) {
  const n = closes.length;
  const ma = (arr, p) => p <= n ? arr.slice(n - p).reduce((a, b) => a + b, 0) / p : null;
  // RSI(14)
  let gains = 0, losses = 0;
  const period = Math.min(14, n - 1);
  for (let i = n - period; i < n; i++) {
    const d = closes[i] - closes[i - 1];
    if (d > 0) gains += d; else losses -= d;
  }
  const avgG = gains / period, avgL = losses / period;
  const rsi = avgL === 0 ? 100 : 100 - 100 / (1 + avgG / avgL);
  // KD(9,3,3)
  const kdP = Math.min(9, n);
  const recentH = highs.slice(n - kdP), recentL = lows.slice(n - kdP);
  const hh = Math.max(...recentH), ll = Math.min(...recentL);
  const rsv = hh !== ll ? (closes[n - 1] - ll) / (hh - ll) * 100 : 50;
  const kdK = 50 * 2/3 + rsv / 3;  // simplified
  const kdD = 50 * 2/3 + kdK / 3;
  // MACD(12,26,9)
  let ema12 = closes[0], ema26 = closes[0];
  const difs = [];
  for (let i = 1; i < n; i++) {
    ema12 = closes[i] * 2/13 + ema12 * 11/13;
    ema26 = closes[i] * 2/27 + ema26 * 25/27;
    difs.push(ema12 - ema26);
  }
  let macdSignal = difs[0] || 0;
  for (let i = 1; i < difs.length; i++) macdSignal = difs[i] * 2/10 + macdSignal * 8/10;
  const macd = difs[difs.length - 1] || 0;
  const macdHist = macd - macdSignal;
  return {
    rsi, kdK, kdD, macd, macdSignal, macdHist,
    ma5: ma(closes, 5), ma10: ma(closes, 10), ma20: ma(closes, 20),
    ma60: ma(closes, 60), ma120: ma(closes, 120),
  };
}

// ═══════ MAIN ═══════
async function main() {
  try {
    const t0 = Date.now();
    if (STEP === 'all' || STEP === '1') await step1_fetchStockList();
    if (STEP === 'all' || STEP === '2') await step2_fetchFundamentals();
    if (STEP === 'all' || STEP === '3') await step3_fetchPricesAndIndicators();

    // 最終統計
    const stats = await client.query(`
      SELECT
        (SELECT COUNT(*) FROM us_stocks) AS stocks,
        (SELECT COUNT(DISTINCT symbol) FROM us_fundamentals WHERE update_date = CURRENT_DATE) AS fund,
        (SELECT COUNT(DISTINCT symbol) FROM us_indicators) AS ind,
        (SELECT COUNT(*) FROM us_daily_prices) AS prices
    `);
    const s = stats.rows[0];
    console.log(`\n════════════════════════════════`);
    console.log(`📊 完成！耗時 ${((Date.now()-t0)/1000/60).toFixed(1)} 分鐘`);
    console.log(`  股票: ${s.stocks} | 基本面: ${s.fund} | 指標: ${s.ind} | 價格記錄: ${s.prices}`);
  } finally {
    client.release();
    await pool.end();
  }
}
main().catch(e => { console.error('💥', e); process.exit(1); });
