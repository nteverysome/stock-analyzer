/**
 * Neon PostgreSQL 數據庫連接 + 助手函數
 * 用途：管理全台灣 1,068 隻股票的數據
 */

import { Pool } from '@neondatabase/serverless';

// 初始化 Neon 連接池
const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // 從 Vercel 環境變數讀取
  ssl: true,
});

/**
 * 執行 SQL 查詢
 */
export async function query(sql, values = []) {
  const client = await pool.connect();
  try {
    return await client.query(sql, values);
  } finally {
    client.release();
  }
}

/**
 * 獲取所有台股清單（1,068 隻）
 */
export async function getAllTaiwanStocks() {
  const result = await query(
    'SELECT symbol, name, industry, sector FROM tw_stocks ORDER BY symbol'
  );
  return result.rows;
}

/**
 * 根據產業篩選股票
 */
export async function getStocksByIndustry(industry) {
  const result = await query(
    'SELECT symbol, name, industry FROM tw_stocks WHERE industry = $1',
    [industry]
  );
  return result.rows;
}

/**
 * 獲取最新股價 + 指標
 */
export async function getLatestStockData(symbol) {
  const result = await query(
    `SELECT 
      s.symbol, s.name, s.industry,
      p.close, p.high, p.low, p.price_date,
      i.m1, i.m2, i.m3, i.m4, i.m5,
      i.kd_fast, i.kd_slow, i.rsi, i.macd
    FROM tw_stocks s
    LEFT JOIN LATERAL (
      SELECT * FROM tw_daily_prices 
      WHERE symbol = $1 
      ORDER BY price_date DESC LIMIT 1
    ) p ON TRUE
    LEFT JOIN LATERAL (
      SELECT * FROM tw_indicators 
      WHERE symbol = $1 
      ORDER BY indicator_date DESC LIMIT 1
    ) i ON TRUE
    WHERE s.symbol = $1`,
    [symbol]
  );
  return result.rows[0] || null;
}

/**
 * 批量獲取多隻股票的最新數據
 */
export async function getMultipleStockData(symbols) {
  const placeholders = symbols.map((_, i) => `$${i + 1}`).join(',');
  const result = await query(
    `SELECT 
      s.symbol, s.name, s.industry,
      p.close, p.high, p.low, p.price_date,
      i.m1, i.m2, i.m3, i.m4, i.m5,
      i.kd_fast, i.kd_slow, i.rsi, i.macd
    FROM tw_stocks s
    LEFT JOIN LATERAL (
      SELECT * FROM tw_daily_prices 
      WHERE symbol = s.symbol 
      ORDER BY price_date DESC LIMIT 1
    ) p ON TRUE
    LEFT JOIN LATERAL (
      SELECT * FROM tw_indicators 
      WHERE symbol = s.symbol 
      ORDER BY indicator_date DESC LIMIT 1
    ) i ON TRUE
    WHERE s.symbol IN (${placeholders})`,
    symbols
  );
  return result.rows;
}

/**
 * 根據技術指標篩選股票
 * 例如：m1 > 450, kd_fast > 70, rsi < 30
 */
export async function screenStocksByIndicators(criteria) {
  let sql = `
    SELECT 
      s.symbol, s.name, s.industry,
      p.close, i.m1, i.m2, i.m3, i.m4, i.m5,
      i.kd_fast, i.kd_slow, i.rsi, i.macd
    FROM tw_stocks s
    LEFT JOIN LATERAL (
      SELECT * FROM tw_daily_prices 
      WHERE symbol = s.symbol 
      ORDER BY price_date DESC LIMIT 1
    ) p ON TRUE
    LEFT JOIN LATERAL (
      SELECT * FROM tw_indicators 
      WHERE symbol = s.symbol 
      ORDER BY indicator_date DESC LIMIT 1
    ) i ON TRUE
    WHERE 1=1
  `;

  const values = [];
  let valueIdx = 1;

  // 動態構建 WHERE 子句
  if (criteria.m1_min) {
    sql += ` AND i.m1 > $${valueIdx}`;
    values.push(criteria.m1_min);
    valueIdx++;
  }
  if (criteria.rsi_max) {
    sql += ` AND i.rsi < $${valueIdx}`;
    values.push(criteria.rsi_max);
    valueIdx++;
  }
  if (criteria.kd_min) {
    sql += ` AND i.kd_fast > $${valueIdx}`;
    values.push(criteria.kd_min);
    valueIdx++;
  }
  if (criteria.industry) {
    sql += ` AND s.industry = $${valueIdx}`;
    values.push(criteria.industry);
    valueIdx++;
  }

  sql += ' LIMIT 100';

  const result = await query(sql, values);
  return result.rows;
}

/**
 * 插入 / 更新每日股價
 */
export async function upsertDailyPrice(symbol, data) {
  const { date, open, high, low, close, volume, turnover } = data;
  const result = await query(
    `INSERT INTO tw_daily_prices 
     (symbol, price_date, open, high, low, close, volume, turnover)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    ON CONFLICT (symbol, price_date) 
    DO UPDATE SET 
      close = $6, volume = $7, turnover = $8, updated_at = NOW()`,
    [symbol, date, open, high, low, close, volume, turnover]
  );
  return result;
}

/**
 * 插入技術指標
 */
export async function upsertIndicators(symbol, data) {
  const { date, m1, m2, m3, m4, m5, kd_fast, kd_slow, rsi, macd } = data;
  const result = await query(
    `INSERT INTO tw_indicators 
     (symbol, indicator_date, m1, m2, m3, m4, m5, kd_fast, kd_slow, rsi, macd)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    ON CONFLICT (symbol, indicator_date)
    DO UPDATE SET
      m1 = $3, m2 = $4, m3 = $5, m4 = $6, m5 = $7,
      kd_fast = $8, kd_slow = $9, rsi = $10, macd = $11`,
    [symbol, date, m1, m2, m3, m4, m5, kd_fast, kd_slow, rsi, macd]
  );
  return result;
}

/**
 * 記錄更新日誌
 */
export async function logUpdate(type, symbol, count, status, error = null) {
  await query(
    `INSERT INTO tw_update_logs 
     (update_type, symbol, record_count, status, error_message, completed_at)
    VALUES ($1, $2, $3, $4, $5, NOW())`,
    [type, symbol, count, status, error]
  );
}

export default pool;
