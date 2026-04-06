/**
 * /api/progress - 實時進度查詢
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
      // 查詢進度
      const priceRes = await client.query('SELECT COUNT(*) as count FROM tw_daily_prices');
      const indicatorRes = await client.query('SELECT COUNT(*) as count FROM tw_indicators');
      const stockRes = await client.query('SELECT COUNT(DISTINCT symbol) as count FROM tw_daily_prices');
      const dateRes = await client.query(`
        SELECT 
          MIN(price_date) as earliest, 
          MAX(price_date) as latest,
          COUNT(DISTINCT price_date) as trading_days
        FROM tw_daily_prices
      `);

      const priceCount = parseInt(priceRes.rows[0].count);
      const indicatorCount = parseInt(indicatorRes.rows[0].count);
      const stockCount = parseInt(stockRes.rows[0].count);
      const { earliest, latest, trading_days } = dateRes.rows[0];

      const pricePercent = ((priceCount / 10000000) * 100).toFixed(1);
      const indicatorPercent = ((indicatorCount / 10000000) * 100).toFixed(1);
      const stockPercent = ((stockCount / 1962) * 100).toFixed(1);

      return res.status(200).json({
        success: true,
        timestamp: new Date().toISOString(),
        progress: {
          prices: {
            count: priceCount,
            target: 10000000,
            percent: parseFloat(pricePercent),
            display: `${priceCount.toLocaleString()} / 10,000,000`,
          },
          indicators: {
            count: indicatorCount,
            target: 10000000,
            percent: parseFloat(indicatorPercent),
            display: `${indicatorCount.toLocaleString()} / 10,000,000`,
          },
          stocks: {
            count: stockCount,
            target: 1962,
            percent: parseFloat(stockPercent),
            display: `${stockCount} / 1,962`,
          },
        },
        timeRange: {
          earliest,
          latest,
          tradingDays: trading_days,
        },
        status: {
          pricesComplete: priceCount >= 5000000,
          indicatorsComplete: indicatorCount >= 5000000,
          isComplete: priceCount >= 5000000 && indicatorCount >= 5000000,
        },
        estimates: {
          pricesETA: priceCount >= 5000000 ? '✅ 完成' : `約 ${(100 - pricePercent).toFixed(1)}% 還需進行`,
          indicatorsETA: indicatorCount >= 5000000 ? '✅ 完成' : `約 ${(100 - indicatorPercent).toFixed(1)}% 還需進行`,
        },
      });
    } finally {
      client.release();
      await pool.end();
    }
  } catch (err) {
    console.error('progress error:', err);
    return res.status(500).json({ error: err.message });
  }
}
