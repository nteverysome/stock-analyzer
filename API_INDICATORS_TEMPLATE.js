/**
 * /api/indicators - 從 Upstash Redis 查詢技術指標
 * 用途：快速返回 292 隻台股的 M1-M5 數據
 * 
 * 使用範例：
 * GET /api/indicators?symbols=2330,2317,2454
 * 返回：{ "2330": { "price": 452.5, "m1": 450.2, "m2": 448.5, ... } }
 */

import { Redis } from '@upstash/redis';

// 初始化 Redis 連接
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export default async function handler(req, res) {
  // 只允許 GET 請求
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { symbols } = req.query;

    // 驗證參數
    if (!symbols) {
      return res.status(400).json({
        error: 'Missing symbols parameter',
        example: '/api/indicators?symbols=2330,2317,2454',
      });
    }

    // 解析符號列表
    const symbolList = symbols.split(',').map(s => s.trim());

    // 從 Redis 批量讀取數據
    const results = {};

    for (const symbol of symbolList) {
      try {
        const key = `stock:${symbol}`;
        const data = await redis.get(key);

        if (data) {
          results[symbol] = data;
        } else {
          results[symbol] = { error: 'No data available' };
        }
      } catch (err) {
        results[symbol] = { error: err.message };
      }
    }

    // 返回結果
    return res.status(200).json({
      success: true,
      count: Object.keys(results).length,
      timestamp: new Date().toISOString(),
      data: results,
    });
  } catch (error) {
    console.error('Error fetching indicators:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
}

/**
 * 數據結構範例：
 * 
 * stock:2330 = {
 *   "symbol": "2330",
 *   "name": "台積電",
 *   "price": 452.5,           // 當前價格
 *   "m1": 450.2,              // 5日均線
 *   "m2": 448.5,              // 10日均線
 *   "m3": 445.0,              // 20日均線
 *   "m4": 440.0,              // 60日均線
 *   "m5": 435.0,              // 120日均線
 *   "kd": 72,                 // KD值（0-100）
 *   "rsi": 65,                // RSI（0-100）
 *   "macd": 8.5,              // MACD 值
 *   "signal": "買入",          // AI 評分
 *   "updatedAt": "2026-04-03T23:00:00Z"  // 更新時間
 * }
 */
