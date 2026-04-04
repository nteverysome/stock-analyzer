/**
 * Vercel Serverless Function - ETF/Index macro fundamentals
 * 抓取大盤估值、信用利差、殖利率曲線等宏觀數據
 */

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36';

async function getYahooCookies() {
  const resp = await fetch('https://finance.yahoo.com/', {
    headers: { 'User-Agent': UA, 'Accept': 'text/html' }, redirect: 'follow',
  });
  const raw = resp.headers.get('set-cookie') || '';
  return raw.split(/,(?=[^ ].*?=)/).map(c => c.trim().split(';')[0]).filter(Boolean).join('; ');
}

async function getYahooCrumb(cookies) {
  const resp = await fetch('https://query1.finance.yahoo.com/v1/test/getcrumb', {
    headers: { 'User-Agent': UA, 'Cookie': cookies },
  });
  if (!resp.ok) throw new Error(`crumb failed: ${resp.status}`);
  const crumb = await resp.text();
  if (!crumb || crumb.includes('<')) throw new Error('invalid crumb');
  return crumb.trim();
}

// 從 Yahoo Finance chart 取最新價格
async function yahooChart(symbol, cookies, crumb) {
  const url = `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=5d&crumb=${encodeURIComponent(crumb)}`;
  const resp = await fetch(url, {
    headers: { 'User-Agent': UA, 'Cookie': cookies, 'Accept': 'application/json' },
  });
  if (!resp.ok) return null;
  const data = await resp.json();
  return data?.chart?.result?.[0]?.meta?.regularMarketPrice ?? null;
}

// 從 Yahoo Finance quoteSummary 取 ETF 基本數據
async function yahooSummary(symbol, cookies, crumb) {
  const url = `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(symbol)}?modules=defaultKeyStatistics,summaryDetail,price&crumb=${encodeURIComponent(crumb)}`;
  const resp = await fetch(url, {
    headers: { 'User-Agent': UA, 'Cookie': cookies, 'Accept': 'application/json' },
  });
  if (!resp.ok) return {};
  const data = await resp.json();
  return data?.quoteSummary?.result?.[0] || {};
}

// FRED API（需環境變數 FRED_API_KEY）
async function fredLatest(seriesId) {
  const key = process.env.FRED_API_KEY;
  if (!key) return null;
  try {
    const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&sort_order=desc&limit=1&file_type=json&api_key=${key}`;
    const resp = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!resp.ok) return null;
    const data = await resp.json();
    const val = data?.observations?.[0]?.value;
    return val && val !== '.' ? parseFloat(val) : null;
  } catch { return null; }
}

// FRED CSV 端點（無需 API Key，更可靠）
async function fredCSVLatest(seriesId) {
  try {
    const url = `https://fred.stlouisfed.org/graph/fredgraph.csv?id=${seriesId}`;
    const resp = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!resp.ok) return null;
    const text = await resp.text();
    if (!text || text.length === 0) return null;

    const lines = text.trim().split('\n').filter(l => l && !l.startsWith('DATE'));
    if (lines.length === 0) return null;

    const lastLine = lines[lines.length - 1];
    const parts = lastLine.split(',');

    // CSV 格式：DATE,VALUE 所以第二個元素是值
    if (parts.length < 2) {
      console.warn(`[fredCSVLatest] ${seriesId}: 無效的 CSV 行格式: ${lastLine}`);
      return null;
    }

    const value = parts[1]?.trim();
    if (!value || value === '.' || value === '' || isNaN(parseFloat(value))) {
      return null;
    }

    const parsed = parseFloat(value);
    return !isNaN(parsed) ? parsed : null;
  } catch(e) {
    console.warn(`[fredCSVLatest] ${seriesId} 獲取失敗:`, e.message);
    return null;
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { ticker } = req.body;
    if (!ticker) return res.status(400).json({ error: 'ticker required' });
    const t = ticker.toUpperCase().trim();

    // 1. Yahoo auth
    const cookies = await getYahooCookies();
    const crumb = await getYahooCrumb(cookies);

    // 2. 並行抓取：ETF 數據 + 殖利率 + FRED 宏觀數據
    // 信用利差和殖利率曲線優先用 CSV 端點（無需 API Key），失敗時降級用 API
    const [summary, tnx, irx, hySpread, yieldCurve, buffettRatio] = await Promise.all([
      yahooSummary(t, cookies, crumb),
      yahooChart('^TNX', cookies, crumb),         // 10Y Treasury yield (%)
      yahooChart('^IRX', cookies, crumb),         // 13-week T-bill rate (%)
      fredCSVLatest('BAMLH0A0HYM2').then(v => v ?? fredLatest('BAMLH0A0HYM2')),  // HY Credit Spread (%) - CSV優先
      fredCSVLatest('T10Y2Y').then(v => v ?? fredLatest('T10Y2Y')),            // 10Y-2Y Yield Curve (%) - CSV優先
      fredCSVLatest('DDDM01USA156NWDB'),         // Buffett Indicator (World Bank: Market Cap / GDP)
    ]);

    const sd = summary.summaryDetail || {};
    const ks = summary.defaultKeyStatistics || {};
    const pr = summary.price || {};

    // 巴菲特指標 = 美國股市總市值 / 年化實質 GDP
    // 分子：昨日收盤總市值（via Wilshire 5000 / FRED DDDM01USA156NWDB）
    // 分母：最新季度公布的年化實質 GDP
    let buffettIndicator = null;

    if (buffettRatio != null) {
      // 優先使用 FRED 已算好的比值 (DDDM01USA156NWDB from World Bank)
      // 這是最可靠的來源，已經過充分驗證
      buffettIndicator = parseFloat(buffettRatio.toFixed(1));
      console.log(`[buffett] 使用 FRED DDDM01USA156NWDB = ${buffettIndicator}%`);
    } else {
      console.log(`[buffett] FRED DDDM01USA156NWDB 無數據，巴菲特指標暫無法取得`);
    }

    const trailingPE = sd.trailingPE?.raw ?? ks.trailingPE?.raw ?? null;
    const price = pr.regularMarketPrice?.raw ?? sd.previousClose?.raw ?? null;
    const yield10y = tnx != null ? parseFloat(tnx.toFixed(3)) : null;
    const yield2y = irx != null ? parseFloat(irx.toFixed(3)) : null;

    // ── 衍生計算
    // 盈餘殖利率 = 1/PE
    const earningsYield = trailingPE ? parseFloat((100 / trailingPE).toFixed(2)) : null;
    // 股票風險溢酬 = 盈餘殖利率 - 10Y殖利率
    const equityRiskPremium = (earningsYield != null && yield10y != null)
      ? parseFloat((earningsYield - yield10y).toFixed(2)) : null;
    // 近似 Shiller PE（trailing PE × 1.15 估算，因 CAPE 使用10年平均盈餘通常高於1年PE）
    const approxCAPE = trailingPE ? parseFloat((trailingPE * 1.15).toFixed(1)) : null;

    // 檢查是否成功取得 FRED 數據（信用利差或殖利率曲線至少有一個）
    const fredSuccess = (hySpread != null || yieldCurve != null);

    // 如果 FRED 失敗，嘗試備用計算殖利率曲線
    const finalYieldCurve = yieldCurve ??
      (yield10y != null && yield2y != null ? parseFloat((yield10y - yield2y).toFixed(3)) : null);

    const output = {
      symbol: t,
      isETF: true,
      price,
      trailingPE,
      approxCAPE,
      earningsYield,
      yield10y,
      yield2y,
      yieldCurve: finalYieldCurve,
      hySpread,
      equityRiskPremium,
      buffettIndicator,
      dividendYield: sd.dividendYield?.raw ? parseFloat((sd.dividendYield.raw * 100).toFixed(2)) : null,
      hasFRED: fredSuccess,  // 根據實際數據是否取得，而非環境變數
      hasAPIKey: !!(process.env.FRED_API_KEY),
    };

    console.log(`[etf-fundamentals] ✅ ${t}:`, {
      price: output.price,
      trailingPE: output.trailingPE,
      hySpread: output.hySpread,
      yieldCurve: output.yieldCurve,
      fredSuccess: fredSuccess
    });
    return res.status(200).json(output);

  } catch (error) {
    console.error('[etf-fundamentals] Error:', error.message);
    return res.status(500).json({ error: error.message });
  }
}

