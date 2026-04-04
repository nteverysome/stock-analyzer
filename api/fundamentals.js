/**
 * Vercel Serverless Function - Get stock fundamentals
 * 使用 Yahoo Finance crumb 認證流程，解決 Vercel 上的 401 封鎖問題
 */

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36';

// Step 1: 取得 Yahoo Finance session cookie
async function getYahooCookies() {
  const resp = await fetch('https://finance.yahoo.com/', {
    headers: { 'User-Agent': UA, 'Accept': 'text/html' },
    redirect: 'follow',
  });
  const raw = resp.headers.get('set-cookie') || '';
  // 把多個 cookie 合併成一個 Cookie header 字串
  const cookies = raw.split(/,(?=[^ ].*?=)/)
    .map(c => c.trim().split(';')[0])
    .filter(Boolean)
    .join('; ');
  return cookies;
}

// Step 2: 取得 crumb（必須帶上 cookie）
async function getYahooCrumb(cookies) {
  const resp = await fetch('https://query1.finance.yahoo.com/v1/test/getcrumb', {
    headers: { 'User-Agent': UA, 'Cookie': cookies },
  });
  if (!resp.ok) throw new Error(`crumb failed: ${resp.status}`);
  const crumb = await resp.text();
  if (!crumb || crumb.includes('<')) throw new Error('invalid crumb');
  return crumb.trim();
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
    console.log(`[fundamentals] Getting ${t}...`);

    try {
      // Step 1 + 2: 取得 cookie 和 crumb
      console.log(`[fundamentals] 取得 Yahoo Finance crumb...`);
      const cookies = await getYahooCookies();
      const crumb = await getYahooCrumb(cookies);
      console.log(`[fundamentals] crumb 取得成功: ${crumb.substring(0, 8)}...`);

      // Step 3: 用 cookie + crumb 呼叫 quoteSummary
      const url = `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${t}?modules=defaultKeyStatistics,summaryDetail,assetProfile,financialData,earningsTrend&crumb=${encodeURIComponent(crumb)}`;
      const resp = await fetch(url, {
        headers: {
          'User-Agent': UA,
          'Accept': 'application/json',
          'Cookie': cookies,
        },
      });

      if (!resp.ok) throw new Error(`quoteSummary ${resp.status}`);

      const data = await resp.json();
      const result = data?.quoteSummary?.result?.[0];
      if (!result) throw new Error(`無數據`);

      const ks = result.defaultKeyStatistics || {};
      const sd = result.summaryDetail || {};
      const ap = result.assetProfile || {};
      const fd = result.financialData || {};
      const et = result.earningsTrend || {};

      // ── Forward PEG = Forward PE ÷ 下一年 EPS 成長預估（分析師 +1y）
      const fwdPE = ks.forwardPE?.raw ?? sd.forwardPE?.raw ?? null;
      const nextYearGrowthRaw = et.trend?.find(tr => tr.period === '+1y')?.growth?.raw ?? null;
      const nextYearGrowthPct = nextYearGrowthRaw != null
        ? parseFloat((nextYearGrowthRaw * 100).toFixed(1))
        : null;
      const pegRatio = (fwdPE != null && nextYearGrowthPct != null && nextYearGrowthPct > 0)
        ? parseFloat((fwdPE / nextYearGrowthPct).toFixed(2))
        : null;

      const output = {
        symbol: t,
        trailingPE:              ks.trailingPE?.raw ?? sd.trailingPE?.raw ?? null,
        forwardPE:               fwdPE,
        pegRatio,                  // Forward PEG = Fwd PE ÷ 分析師下一年EPS成長預估
        pegGrowthUsed:             nextYearGrowthPct,  // 前端 tooltip 顯示用
        // 毛利率 / 營業利潤率 / 淨利率 → financialData
        grossMargins:            fd.grossMargins?.raw ?? ks.grossMargins?.raw ?? null,
        operatingMargins:        fd.operatingMargins?.raw ?? ks.operatingMargins?.raw ?? null,
        profitMargins:           fd.profitMargins?.raw ?? ks.profitMargins?.raw ?? null,
        // 成長率 → financialData
        revenueGrowth:           fd.revenueGrowth?.raw ?? ks.revenueGrowth?.raw ?? null,
        earningsGrowth:          fd.earningsGrowth?.raw ?? ks.earningsGrowth?.raw ?? null,
        // 自由現金流 → financialData
        freeCashflow:            fd.freeCashflow?.raw ?? ks.freeCashflow?.raw ?? null,
        // 分析師目標 → financialData
        targetMeanPrice:         fd.targetMeanPrice?.raw ?? ks.targetMeanPrice?.raw ?? null,
        targetLowPrice:          fd.targetLowPrice?.raw ?? ks.targetLowPrice?.raw ?? null,
        targetHighPrice:         fd.targetHighPrice?.raw ?? ks.targetHighPrice?.raw ?? null,
        numberOfAnalystOpinions: fd.numberOfAnalystOpinions?.raw ?? ks.numberOfAnalystOpinions?.raw ?? null,
        recommendationKey:       fd.recommendationKey ?? ks.recommendationKey ?? 'hold',
        beta:                    ks.beta?.raw ?? sd.beta?.raw ?? null,
        marketCap:               ks.marketCap?.raw ?? sd.marketCap?.raw ?? null,
        dividendYield:           sd.dividendYield?.raw ?? null,
        sector:                  ap.sector ?? 'N/A',
        industry:                ap.industry ?? 'N/A',
        earningsTimestamp:       ks.nextEarningsDate?.raw ?? null,
      };

      console.log(`[fundamentals] ✅ ${t}:`, { PE: output.trailingPE, PEG: output.pegRatio, GM: output.grossMargins });
      return res.status(200).json(output);

    } catch (err) {
      console.error(`[fundamentals] 失敗 for ${t}:`, err.message);
      // 回傳 symbol 讓前端至少能繼續，欄位為 null 前端會顯示 N/A
      return res.status(200).json({ symbol: t, _error: err.message });
    }

  } catch (error) {
    console.error('[fundamentals] Fatal:', error.message);
    return res.status(500).json({ error: error.message });
  }
}

