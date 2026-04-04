/**
 * 台灣股票 API
 * 從 Neon 數據庫提供台股數據
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

// 獲取所有股票
export async function getStocks(req, res) {
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
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}

// 獲取股票詳情
export async function getStockDetail(req, res) {
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

    // 獲取價格歷史
    const pricesRes = await query(
      `SELECT price_date, open, high, low, close, volume 
       FROM tw_daily_prices 
       WHERE symbol = $1 
       ORDER BY price_date DESC 
       LIMIT 120`,
      [symbol]
    );

    const prices = pricesRes.rows.reverse(); // 按時間順序排列

    res.status(200).json({
      success: true,
      stock,
      prices,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}

// 搜尋股票
export async function searchStocks(req, res) {
  try {
    const { keyword } = req.query;
    
    if (!keyword) {
      return res.status(400).json({
        success: false,
        message: '缺少 keyword 參數',
      });
    }

    const result = await query(
      `SELECT symbol, name, industry, sector FROM tw_stocks 
       WHERE symbol ILIKE $1 OR name ILIKE $1 
       ORDER BY symbol`,
      [`%${keyword}%`]
    );

    res.status(200).json({
      success: true,
      stocks: result.rows,
      count: result.rows.length,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}

export default { getStocks, getStockDetail, searchStocks };
