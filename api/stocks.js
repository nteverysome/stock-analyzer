/**
 * Vercel API Route: /api/stocks
 * 獲取所有台灣股票
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
    const result = await query(
      'SELECT symbol, name, industry, sector FROM tw_stocks ORDER BY symbol'
    );
    
    res.status(200).json({
      success: true,
      stocks: result.rows,
      count: result.rows.length,
    });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}
