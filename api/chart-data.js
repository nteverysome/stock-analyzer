/**
 * /api/chart-data - K 線圖數據 API（改用 neon HTTP 模式）
 */
import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    res.status(200).json({ ok: true });
    return;
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'GET or POST only' });
  }

  const params = req.method === 'POST' ? (req.body || {}) : (req.query || {});
  const { symbol, start_date, end_date } = params;

  if (!symbol) {
    return res.status(400).json({ error: 'symbol required' });
  }

  try {
    if (!process.env.DATABASE_URL) {
      return res.status(500).json({ error: 'DATABASE_URL not configured' });
    }

    const sql = neon(process.env.DATABASE_URL);
    let rows;

    if (start_date && end_date) {
      rows = await sql`
        SELECT p.symbol, p.price_date, p.open, p.high, p.low, p.close, p.volume,
               i.rsi, i.kd_fast, i.kd_slow, i.macd, i.macd_signal, i.macd_histogram,
               i.m1 AS ma5, i.m2 AS ma10, i.m3 AS ma20, i.m4 AS ma60, i.m5 AS ma120
        FROM tw_daily_prices p
        LEFT JOIN tw_indicators i ON p.symbol = i.symbol AND p.price_date = i.indicator_date
        WHERE p.symbol = ${symbol} AND p.price_date >= ${start_date} AND p.price_date <= ${end_date}
        ORDER BY p.price_date ASC
      `;
    } else if (start_date) {
      rows = await sql`
        SELECT p.symbol, p.price_date, p.open, p.high, p.low, p.close, p.volume,
               i.rsi, i.kd_fast, i.kd_slow, i.macd, i.macd_signal, i.macd_histogram,
               i.m1 AS ma5, i.m2 AS ma10, i.m3 AS ma20, i.m4 AS ma60, i.m5 AS ma120
        FROM tw_daily_prices p
        LEFT JOIN tw_indicators i ON p.symbol = i.symbol AND p.price_date = i.indicator_date
        WHERE p.symbol = ${symbol} AND p.price_date >= ${start_date}
        ORDER BY p.price_date ASC
      `;
    } else if (end_date) {
      rows = await sql`
        SELECT p.symbol, p.price_date, p.open, p.high, p.low, p.close, p.volume,
               i.rsi, i.kd_fast, i.kd_slow, i.macd, i.macd_signal, i.macd_histogram,
               i.m1 AS ma5, i.m2 AS ma10, i.m3 AS ma20, i.m4 AS ma60, i.m5 AS ma120
        FROM tw_daily_prices p
        LEFT JOIN tw_indicators i ON p.symbol = i.symbol AND p.price_date = i.indicator_date
        WHERE p.symbol = ${symbol} AND p.price_date <= ${end_date}
        ORDER BY p.price_date ASC
      `;
    } else {
      rows = await sql`
        SELECT p.symbol, p.price_date, p.open, p.high, p.low, p.close, p.volume,
               i.rsi, i.kd_fast, i.kd_slow, i.macd, i.macd_signal, i.macd_histogram,
               i.m1 AS ma5, i.m2 AS ma10, i.m3 AS ma20, i.m4 AS ma60, i.m5 AS ma120
        FROM tw_daily_prices p
        LEFT JOIN tw_indicators i ON p.symbol = i.symbol AND p.price_date = i.indicator_date
        WHERE p.symbol = ${symbol}
        ORDER BY p.price_date ASC
      `;
    }

    const candles = rows.map(r => ({
      date: r.price_date,
      open: parseFloat(r.open),
      high: parseFloat(r.high),
      low: parseFloat(r.low),
      close: parseFloat(r.close),
      volume: parseInt(r.volume),
      rsi: r.rsi != null ? parseFloat(r.rsi) : null,
      kdFast: r.kd_fast != null ? parseFloat(r.kd_fast) : null,
      kdSlow: r.kd_slow != null ? parseFloat(r.kd_slow) : null,
      macd: r.macd != null ? parseFloat(r.macd) : null,
      macdSignal: r.macd_signal != null ? parseFloat(r.macd_signal) : null,
      macdHistogram: r.macd_histogram != null ? parseFloat(r.macd_histogram) : null,
      ma5: r.ma5 != null ? parseFloat(r.ma5) : null,
      ma10: r.ma10 != null ? parseFloat(r.ma10) : null,
      ma20: r.ma20 != null ? parseFloat(r.ma20) : null,
      ma60: r.ma60 != null ? parseFloat(r.ma60) : null,
      ma120: r.ma120 != null ? parseFloat(r.ma120) : null,
    }));

    return res.status(200).json({
      success: true,
      symbol,
      count: candles.length,
      candles,
    });
  } catch (err) {
    console.error('chart-data error:', err);
    return res.status(500).json({ error: err.message });
  }
}
