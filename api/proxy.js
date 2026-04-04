/**
 * Vercel Serverless Function - Generic proxy for Yahoo Finance & CNN APIs
 * 對 quoteSummary 請求自動加入 crumb 認證
 */

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36';

// 取得 Yahoo Finance cookie + crumb（解決 Vercel 上的 401 問題）
async function getYahooAuth() {
  // 訪問 finance.yahoo.com 主頁取得完整 session cookies（含 A1、A3 等必要 token）
  const homeResp = await fetch('https://finance.yahoo.com/', {
    headers: { 'User-Agent': UA, 'Accept': 'text/html' },
    redirect: 'follow',
  });
  const rawCookie = homeResp.headers.get('set-cookie') || '';
  const cookies = rawCookie.split(/,(?=[^ ].*?=)/)
    .map(c => c.trim().split(';')[0])
    .filter(c => c.includes('='))
    .join('; ');

  // 用 session cookies 取得 crumb
  const crumbResp = await fetch('https://query1.finance.yahoo.com/v1/test/getcrumb', {
    headers: { 'User-Agent': UA, 'Cookie': cookies },
  });
  if (!crumbResp.ok) throw new Error(`crumb request failed: ${crumbResp.status}`);
  const crumb = (await crumbResp.text()).trim();
  if (!crumb || crumb.startsWith('<') || crumb.startsWith('{') || crumb.length > 20) {
    throw new Error(`invalid crumb: ${crumb.substring(0, 30)}`);
  }
  return { cookies, crumb };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'url required' });

    const allowedHosts = ['query1.finance.yahoo.com', 'query2.finance.yahoo.com', 'production.dataviz.cnn.io'];
    if (!allowedHosts.some(h => url.includes(h))) {
      return res.status(403).json({ error: 'URL not allowed' });
    }

    console.log(`[Proxy] Fetching: ${url.substring(0, 80)}`);

    // quoteSummary 需要 crumb 認證
    if (url.includes('quoteSummary')) {
      try {
        const { cookies, crumb } = await getYahooAuth();
        console.log(`[Proxy] Got crumb for quoteSummary: ${crumb.substring(0, 8)}...`);

        const authUrl = url.includes('?')
          ? `${url}&crumb=${encodeURIComponent(crumb)}`
          : `${url}?crumb=${encodeURIComponent(crumb)}`;

        const response = await fetch(authUrl, {
          headers: { 'User-Agent': UA, 'Cookie': cookies, 'Accept': 'application/json' },
        });

        if (!response.ok) throw new Error(`quoteSummary ${response.status}`);
        const data = await response.json();
        console.log(`[Proxy] ✅ quoteSummary success`);
        return res.status(200).json(data);
      } catch (authErr) {
        console.error(`[Proxy] crumb auth failed: ${authErr.message}`);
        return res.status(502).json({ error: `Yahoo Finance auth failed: ${authErr.message}` });
      }
    }

    // 其他 URL（chart、VIX、CNN 等）直接請求
    const response = await fetch(url, {
      headers: {
        'User-Agent': UA,
        'Accept': 'application/json, text/plain, */*',
        'Referer': 'https://finance.yahoo.com/',
      },
    });

    if (!response.ok) return res.status(response.status).json({ error: `API ${response.status}` });

    const data = await response.json();
    res.setHeader('Cache-Control', 'public, max-age=300');
    return res.status(200).json(data);

  } catch (error) {
    console.error('[Proxy Error]', error.message);
    return res.status(500).json({ error: error.message });
  }
}

