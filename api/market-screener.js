/**
 * GET /api/market-screener
 * 全台灣股市篩選引擎 - 支持 1,068 隻股票
 * 
 * 使用範例：
 * GET /api/market-screener?market=all&industry=semiconductor
 * GET /api/market-screener?symbols=2330,2317,2454
 * GET /api/market-screener?filter=kd_oversold&limit=20
 */

import {
  getAllTaiwanStocks,
  getStocksByIndustry,
  getMultipleStockData,
  screenStocksByIndicators,
} from './neon-db.js';

// 台灣股市產業分類
const INDUSTRIES = {
  semiconductor: ['半導體', 'Semiconductor'],
  electronics: ['電子', '電子零件', 'Electronics'],
  finance: ['金融', 'Finance'],
  cement: ['水泥', 'Cement'],
  steel: ['鋼鐵', 'Steel'],
  chemical: ['化學', 'Chemical'],
  etf: ['ETF', 'Fund'],
};

export default async function handler(req, res) {
  // 只允許 GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { market, industry, symbols, filter, limit = 50 } = req.query;

    let results = [];

    // 🔹 場景 1：獲取所有台股清單（1,068 隻）
    if (market === 'all' && !industry && !symbols) {
      results = await getAllTaiwanStocks();
    }

    // 🔹 場景 2：按產業篩選
    else if (industry) {
      const industryName = INDUSTRIES[industry]?.[0];
      if (!industryName) {
        return res.status(400).json({
          error: 'Invalid industry',
          validIndustries: Object.keys(INDUSTRIES),
        });
      }
      results = await getStocksByIndustry(industryName);
    }

    // 🔹 場景 3：指定符號查詢
    else if (symbols) {
      const symbolList = symbols.split(',').map(s => s.trim().toUpperCase());
      results = await getMultipleStockData(symbolList);
    }

    // 🔹 場景 4：技術指標篩選
    else if (filter) {
      let criteria = {};

      switch (filter) {
        case 'kd_oversold':
          // KD 超賣（< 20）
          criteria = { kd_min: 0, kd_max: 20 };
          break;
        case 'kd_overbought':
          // KD 超買（> 80）
          criteria = { kd_min: 80 };
          break;
        case 'rsi_oversold':
          // RSI 超賣（< 30）
          criteria = { rsi_max: 30 };
          break;
        case 'rsi_overbought':
          // RSI 超買（> 70）
          criteria = { rsi_min: 70 };
          break;
        case 'ma_bullish':
          // 均線多頭（m1 > m2 > m3）
          // 需要在數據庫層面實現更複雜的篩選
          break;
        default:
          return res.status(400).json({
            error: 'Invalid filter',
            validFilters: [
              'kd_oversold',
              'kd_overbought',
              'rsi_oversold',
              'rsi_overbought',
              'ma_bullish',
            ],
          });
      }

      results = await screenStocksByIndicators(criteria);
    }

    // 🔹 默認：返回所有股票
    else {
      results = await getAllTaiwanStocks();
    }

    // 應用 limit
    const limited = results.slice(0, parseInt(limit) || 50);

    return res.status(200).json({
      success: true,
      market: 'Taiwan',
      total: results.length,
      returned: limited.length,
      data: limited,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Screener error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
}

/**
 * 數據結構範例：
 * 
 * {
 *   "success": true,
 *   "market": "Taiwan",
 *   "total": 1068,
 *   "returned": 10,
 *   "data": [
 *     {
 *       "symbol": "2330",
 *       "name": "台積電",
 *       "industry": "半導體",
 *       "close": 452.5,
 *       "high": 455.0,
 *       "low": 450.0,
 *       "price_date": "2026-04-03",
 *       "m1": 450.2,
 *       "m2": 448.5,
 *       "m3": 445.0,
 *       "m4": 440.0,
 *       "m5": 435.0,
 *       "kd_fast": 72,
 *       "kd_slow": 68,
 *       "rsi": 65,
 *       "macd": 8.5
 *     }
 *   ]
 * }
 */
