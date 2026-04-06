/**
 * /api/verify - 驗證數據補抓狀況
 */
import { Pool } from '@neondatabase/serverless';

export default async function handler(req, res) {
  // 設置 CORS 頭
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Max-Age', '86400');

  // 處理 OPTIONS 請求（CORS 預檢）
  if (req.method === 'OPTIONS') {
    res.status(200).json({ ok: true });
    return;
  }

  try {
    if (!process.env.DATABASE_URL) {
      return res.status(500).json({ error: 'DATABASE_URL not configured' });
    }

    const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: true });
    const client = await pool.connect();

    try {
      // 1. 檢查價格表
      const priceRes = await client.query('SELECT COUNT(*) as count FROM tw_daily_prices');
      const priceCount = parseInt(priceRes.rows[0].count);

      // 2. 檢查指標表
      const indicatorRes = await client.query('SELECT COUNT(*) as count FROM tw_indicators');
      const indicatorCount = parseInt(indicatorRes.rows[0].count);

      // 3. 檢查股票覆蓋
      const stockRes = await client.query('SELECT COUNT(DISTINCT symbol) as count FROM tw_daily_prices');
      const stockCount = parseInt(stockRes.rows[0].count);

      // 4. 檢查時間範圍
      const dateRes = await client.query(`
        SELECT 
          MIN(price_date) as earliest,
          MAX(price_date) as latest,
          COUNT(DISTINCT price_date) as trading_days
        FROM tw_daily_prices
      `);
      const { earliest, latest, trading_days } = dateRes.rows[0];

      // 5. 檢查平均記錄數
      const avgRes = await client.query(`
        SELECT 
          AVG(cnt)::int as avg_records,
          MIN(cnt) as min_records,
          MAX(cnt) as max_records
        FROM (
          SELECT symbol, COUNT(*) as cnt 
          FROM tw_daily_prices 
          GROUP BY symbol
        ) t
      `);
      const { avg_records, min_records, max_records } = avgRes.rows[0];

      // 6. 樣本股票檢查
      const sampleRes = await client.query(`
        SELECT 
          COUNT(*) as price_count,
          MIN(price_date) as earliest,
          MAX(price_date) as latest
        FROM tw_daily_prices
        WHERE symbol = '2330'
      `);
      const sample = sampleRes.rows[0];

      // 計算完成度
      const priceProgress = Math.min((priceCount / 10000000) * 100, 100);
      const indicatorProgress = Math.min((indicatorCount / 10000000) * 100, 100);
      const isComplete = priceCount > 5000000 && indicatorCount > 5000000;

      return res.status(200).json({
        success: true,
        timestamp: new Date().toISOString(),
        summary: {
          isComplete,
          status: isComplete ? '✅ 補抓完成' : (priceCount > 100000 ? '⏳ 進行中' : '❌ 未開始'),
          progress: {
            prices: priceProgress.toFixed(1),
            indicators: indicatorProgress.toFixed(1),
          },
        },
        prices: {
          count: priceCount,
          expected: '10,000,000+',
          unit: '筆',
          status: priceCount > 100000 ? '✅' : '❌',
        },
        indicators: {
          count: indicatorCount,
          expected: '10,000,000+',
          unit: '筆',
          status: indicatorCount > 100000 ? '✅' : '❌',
        },
        coverage: {
          count: stockCount,
          expected: 1962,
          percent: ((stockCount / 1962) * 100).toFixed(1),
          status: stockCount > 1900 ? '✅' : '⚠️',
        },
        timeRange: {
          earliest,
          latest,
          tradingDays: trading_days,
          expected: '>1,200 天',
          status: trading_days > 1000 ? '✅' : '⚠️',
        },
        avgRecords: {
          avg: avg_records,
          min: min_records,
          max: max_records,
          status: avg_records > 3000 ? '✅' : '⚠️',
        },
        sample2330: {
          symbol: '2330',
          priceCount: parseInt(sample.price_count),
          earliest: sample.earliest,
          latest: sample.latest,
          status: sample.price_count > 1000 ? '✅' : '⚠️',
        },
      });
    } finally {
      client.release();
      await pool.end();
    }
  } catch (err) {
    console.error('verify error:', err);
    return res.status(500).json({ error: err.message });
  }
}
