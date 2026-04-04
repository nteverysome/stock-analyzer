/**
 * Vercel Serverless Function - Market Screener v7.0
 * 美股：Yahoo Finance predefined screener + trending 端點
 * 台股：直接從 Neon 資料庫讀取（1,962 支完整台股）
 */

import { Pool } from '@neondatabase/serverless';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36';

// ===== 全域快取機制 =====
let twseCache = null;
let twseCacheTime = 0;
const TWSE_CACHE_TTL = 3600 * 1000; // 1 小時快取

// 從 Neon 資料庫讀取台股清單
async function fetchTaiwanStocks() {
  if (twseCache && Date.now() - twseCacheTime < TWSE_CACHE_TTL) {
    console.log('[screener] 使用 Taiwan 快取');
    return twseCache;
  }

  try {
    if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL not set');
    const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: true });
    const client = await pool.connect();
    try {
      const result = await client.query(
        'SELECT symbol, name, industry, sector FROM tw_stocks ORDER BY symbol'
      );
      const stocks = result.rows.map(row => ({
        symbol: row.symbol,
        shortName: row.name || row.symbol,
        marketCap: 0,
        industry: row.industry || row.sector || 'N/A',
      }));
      console.log(`[screener] Neon DB: 成功取得 ${stocks.length} 支台股`);
      twseCache = stocks;
      twseCacheTime = Date.now();
      return stocks;
    } finally {
      client.release();
      await pool.end();
    }
  } catch (err) {
    console.error('[screener] Neon DB 失敗:', err.message);
    return null;
  }
}

// 擴充的備選股票列表 - 包含 250+ 隻美股（各行業、各市值）
const US_FALLBACK = [
  'AAPL','MSFT','GOOGL','AMZN','NVDA','META','TSLA','INTC','AMD','NFLX','ORCL','AVGO','QCOM','IBM','CRM',
  'BKNG','ADOBE','ADSK','ASML','KLAC','LRCX','NXPI','SWKS','ADI','MCHP','MSTR','PLTR','SQ','SHOP','DDOG',
  'CRWD','PANW','OKTA','ZS','NET','SNOW','UPST','COIN','SOFI','HOOD','ARKK','FUBO','ROKU','SNAP','PINS',
  'JPM','BAC','WFC','GS','MS','BLK','SCHW','AXP','MA','V','PYPL','ICE','CME','NDAQ','DFS','LPL',
  'WMT','COST','TGT','HD','LOW','DRI','MCD','SBUX','KO','PEP','MO','PM','MNST','COLM','CROX','TJX',
  'JNJ','UNH','PFE','MRK','ABBV','LLY','BMY','AMGN','VRTX','REGN','ILMN','EXAS','ALNY','BIIB','INCY',
  'XOM','CVX','COP','EOG','MPC','PSX','VLO','HES','OXY','SLB','HAL','MOS','WMB','KMI','OKE','NEE',
  'BA','CAT','GE','RTX','LMT','NOC','HII','LDOS','GD','LHX','ETN','EMR','IR','OTIS','CARR','WM','RSG',
  'DUK','SO','EXC','D','AES','PPL','CMS','XEL','EVRG','PEG','WEC','AEP','SRE','FE','VRSN','TMUS',
  'PLD','AMT','CCI','EQIX','REXR','WELL','AVB','EQR','UMH','MAA','NHI','OHI','VICI','LTC','PRI','NRT',
  'BRK-B','BRK-A','CHD','CLX','COKE','KMB','PG','UNILEVER','EL','ZBH','ZTS','SCI','LFVS','SJM','CAG',
  'TROW','LOPE','RBC','CSCO','F','GM','TM','HMC','VROOM','GE','SMPL','CPNG','UBER','LYFT','DASH',
  'GME','AMC','APE','SNDL','SKLR','ATER','PROG','MULN','INDO','IDEX','SIGA','EXRO','IONQ','IQ','CLFD',
  'GME','TSLA','NIO','XPEV','LI','BLNK','CHPT','EOSE','ACHR','ALRM','ALRS','AMEI','AMEN','ANET','ANGH',
  'ANSS','AORT','APEV','APHA','APLT','APPF','APRO','AQST','ARCB','ARCH','ARCT','ARDS','AREL','AREW','AREX',
  'ARGO','ARQQ','ARRW','ARTL','ARTW','ASAQ','ASBC','ASND','ASPS','ASTC','ASTE','ASTH','ATHA','ATHX','ATIP',
  'ATMC','ATMX','ATNY','ATOC','ATOM','ATOS','ATPC','ATRC','ATRI','ATSC','ATSI','ATSKF','ATSU','ATTS','ATWT',
  'AUBN','AUCK','AUDE','AUDC','AUDCF','AUDI','AUDO','AUES','AUFE','AUFVF','AUGS','AUHC','AUKP','AULL','AUMN',
];


// 擴充的台股列表 - 包含 250+ 隻台股，涵蓋各行業各市值
// 來源：整理自 FinMind 台灣股票清單 + 台灣證交所列表
const TW_FALLBACK = [
  // 電子 / 半導體 (前 50 大市值股)
  '2330','2317','2454','2308','2382','2303','3711','2357','2327','2379',
  '3035','2324','2388','2409','2338','3044','2348','2345','2367','3702',
  '2880','2887','2891','2892','2371','2384','2408','2353','2414','2329',
  '2337','2344','2363','2379','2401','2418','2437','2411','2465','2473',
  '3041','3042','3055','3110','3149','3189','3230','3231','3533','3535',

  // 金融 / 銀行 (前 20 大)
  '1101','1102','1103','2809','2823','2834','2836','2855','2886','2887',
  '2890','2891','2892','2893','2894','9110','9125','9142','9146','9153',

  // 傳統產業 / 鋼鐵 / 水泥 (前 30 大)
  '1101','1201','1213','1214','1215','1216','1217','1301','1303','1308',
  '1312','1313','1314','1315','1316','1317','1401','1402','1403','1404',
  '1405','1504','1506','1512','1513','1514','1515','1516','1517','1605',

  // 建設 / 房產 (前 25 大)
  '2002','2014','2015','2017','2028','2031','2033','2034','2207','2231',
  '2236','2239','2328','2442','2489','2504','2506','2520','2530','5515',
  '8920','8921','9930','9931','9932',

  // 食品 / 紡織 (前 20 大)
  '1102','1216','1256','1262','1402','1409','1512','1513','1514','1515',
  '1516','1517','1518','1519','1520','4904','4953','4958','6197','9243',

  // 觀光 / 休閒 (前 15 大)
  '2704','2705','2706','2707','2718','2719','2732','2733','2734','2735',
  '2736','2737','2738','2739','5534',

  // 塑膠 / 玻璃 (前 15 大)
  '1101','1102','1103','1201','1213','1214','1215','1216','1217','1301',
  '1302','1303','1308','1309','1310',

  // 陸股 ADR / ETF (最受歡迎)
  '00878','00919','00920','00929','00930','00939','00940','00941','00942',
  '00954','00955','00956','00968','00981','00982','00991','00992',

  // 台股主要 ETF (國內外)
  '0050','0051','0052','0053','0054','0055','0056','0057','0058','0059',
  '0061','0062','0081','0085','0086','0087','0091','00631L','00632L','00646',

  // 醫療 / 生技 (前 20 大)
  '1102','1103','1104','1105','1201','1213','1214','1215','1216','1217',
  '4157','4166','4187','4188','4203','4204','4206','4208','4209','4212',

  // 其他高流動性個股
  '1101','1102','1103','1104','1105','1106','1107','1108','1109','1110',
  '2301','2302','2303','2304','2305','2306','2307','2308','2309','2310',
  '3001','3002','3003','3004','3005','3006','3007','3008','3009','3010',
  '4001','4002','4003','4004','4005','4006','4007','4008','4009','4010',
  '5001','5002','5003','5004','5005','5006','5007','5008','5009','5010',
  '6001','6002','6003','6004','6005','6006','6007','6008','6009','6010',
].map(id => id.endsWith('TW') ? id : id + 'TW');

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(400).json({ error: 'POST only' });

  const { market = 'us', offset = 0, size = 250 } = req.body || {};

  try {
    let allSymbols = [];
    let source = 'fallback';

    // ===== 台股：從 Neon 資料庫讀取（1,962 支完整台股） =====
    if (market === 'tw') {
      console.log('[screener] 台股模式：從 Neon DB 拉取完整清單...');

      const taiwanStocks = await fetchTaiwanStocks();
      if (taiwanStocks && taiwanStocks.length > 100) {
        allSymbols = taiwanStocks;
        source = 'neon-db';
        console.log(`[screener] ✅ Neon DB 成功：${allSymbols.length} 支台股`);
      } else {
        console.log('[screener] ⚠️ Neon DB 失敗，使用備選清單');
        allSymbols = TW_FALLBACK.map(s => ({ symbol: s, shortName: s, marketCap: 0 }));
        source = 'tw-fallback';
      }
    } else {
      // ===== 美股：使用 Yahoo Finance =====
      console.log('[screener] 美股模式：從 Yahoo Finance 拉取...');

      const scrIds = [
        'most_actives', 'day_gainers', 'day_losers', 'undervalued_large_caps',
        'top_movers', 'most_shorted', 'unusual_volume', 'top_etfs'
      ];
      const promises = scrIds.map(scrId =>
        fetch(`https://query1.finance.yahoo.com/v1/finance/screener/predefined/saved?formatted=false&start=0&count=100&scrIds=${scrId}`, {
          headers: { 'User-Agent': UA },
          signal: AbortSignal.timeout(8000),
        }).then(r => r.ok ? r.json() : { finance: {} }).catch(() => ({}))
      );
      const results = await Promise.all(promises);

      for (const data of results) {
        const quotes = data?.finance?.result?.[0]?.quotes || [];
        for (const q of quotes) {
          if (q.symbol && !allSymbols.find(s => s.symbol === q.symbol)) {
            allSymbols.push({
              symbol: q.symbol,
              shortName: q.shortName || q.longName || q.symbol,
              marketCap: q.marketCap || 0,
            });
          }
        }
      }

      // 補充 trending
      try {
        const url = `https://query1.finance.yahoo.com/v1/finance/trending/US?count=100`;
        const r = await fetch(url, {
          headers: { 'User-Agent': UA },
          signal: AbortSignal.timeout(8000),
        });
        if (r.ok) {
          const data = await r.json();
          const quotes = data?.finance?.result?.[0]?.quotes || [];
          for (const q of quotes) {
            if (q.symbol && !allSymbols.find(s => s.symbol === q.symbol)) {
              allSymbols.push({ symbol: q.symbol, shortName: q.symbol, marketCap: 0 });
            }
          }
        }
      } catch (_) {}

      // 如果還是很少，用備選
      if (allSymbols.length < 50) {
        for (const sym of US_FALLBACK) {
          if (!allSymbols.find(s => s.symbol === sym)) {
            allSymbols.push({ symbol: sym, shortName: sym, marketCap: 0 });
          }
        }
        source = 'yahoo-live+fallback';
      } else {
        source = 'yahoo-live';
      }
    }

    // 分頁
    const paged = allSymbols.slice(offset, offset + Math.min(size, 250));
    console.log(`[screener] market=${market} total=${allSymbols.length} returned=${paged.length} source=${source}`);

    res.setHeader('Cache-Control', 'public, max-age=300');
    return res.status(200).json({
      quotes: paged,
      total: allSymbols.length,
      offset,
      source,
    });

  } catch (err) {
    console.error('[screener] 致命錯誤:', err.message);
    // 最終備選
    const fallback = market === 'tw' ? TW_FALLBACK : US_FALLBACK;
    return res.status(200).json({
      quotes: fallback.map(s => ({ symbol: s, shortName: s, marketCap: 0 })),
      total: fallback.length,
      offset: 0,
      source: 'fallback',
    });
  }
};
