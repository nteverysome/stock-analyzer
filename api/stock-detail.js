/**
 * Vercel API Route: /api/stock-detail/[symbol]
 * 獲取單隻股票的詳細信息和歷史價格
 */

import { Pool } from '@neondatabase/serverless';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: true,
});

async function query(sql, values = []) {
  const client = await pool.connect();
  try {
    return await client.query(sql, values);
  } finally {
    client.release();
  }
}

export default async function handler(req, res) {
  // 設置 CORS 頭
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { symbol } = req.query;
    
    if (!symbol) {
      return res.status(400).json({
        success: false,
        message: '缺少 symbol 參數',
      });
    }

    // 獲取股票基本信息
    const stockRes = await query(
      'SELECT * FROM tw_stocks WHERE symbol = $1',
      [symbol]
    );
    
    if (stockRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '股票未找到',
      });
    }

    const stock = stockRes.rows[0];

    // 獲取價格歷史（最近 120 天）
    const pricesRes = await query(
      `SELECT price_date, open, high, low, close, volume 
       FROM tw_daily_prices 
       WHERE symbol = $1 
       ORDER BY price_date ASC`,
      [symbol]
    );

    res.status(200).json({
      success: true,
      stock,
      prices: pricesRes.rows,
    });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}
