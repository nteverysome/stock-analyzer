/**
 * /api/chart-data - K 線圖數據 API
 * 支持台股（從 Neon DB）和美股（從 Yahoo Finance）
 */
import { neon } from '@neondatabase/serverless';

// Yahoo Finance 數據取得函數
async function fetchYahooData(symbol, interval = '1d', range = '2y') {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=${interval}&range=${range}`;
    const response = await fetch(url);
    if (!response.ok) return null;
    const data = await response.json();
    const result = data?.chart?.result?.[0];
    if (!result) return null;

    const timestamps = result.timestamp || [];
    const quotes = result.indicators?.quote?.[0] || {};
    const candles = [];

    for (let i = 0; i < timestamps.length; i++) {
      const close = quotes.close?.[i];
      if (close != null && close > 0) {
        candles.push({
          date: new Date(timestamps[i] * 1000).toISOString().split('T')[0],
          open: quotes.open?.[i] || close,
          high: quotes.high?.[i] || close,
          low: quotes.low?.[i] || close,
          close: close,
          volume: quotes.volume?.[i] || 0,
          rsi: null,
          kdFast: null,
          kdSlow: null,
          macd: null,
          macdSignal: null,
          macdHistogram: null,
          ma5: null,
          ma10: null,
          ma20: null,
          ma60: null,
          ma120: null,
        });
      }
    }
    return candles;
  } catch (e) {
    console.error('Yahoo fetch error:', e);
    return null;
  }
}

// 簡易技術指標計算（用於美股，因為 Yahoo 不提供）
function calculateIndicators(candles) {
  if (candles.length === 0) return candles;

  // 簡單移動平均
  const sma = (data, period) => {
    return data.map((_, i) => {
      if (i < period - 1) return null;
      const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b.close, 0);
      return sum / period;
    });
  };

  const ma5 = sma(candles, 5);
  const ma10 = sma(candles, 10);
  const ma20 = sma(candles, 20);
  const ma60 = sma(candles, 60);
  const ma120 = sma(candles, 120);

  return candles.map((c, i) => ({
    ...c,
    ma5: ma5[i],
    ma10: ma10[i],
    ma20: ma20[i],
    ma60: ma60[i],
    ma120: ma120[i],
  }));
}

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
    let candles = [];

    // 判斷是否為美股（全大寫 + 字數 1-5）或台股（純數字）
    const isTWStock = /^\d{4}$/.test(symbol);

    if (!isTWStock) {
      // ── 美股：從 Yahoo Finance 取得
      candles = await fetchYahooData(symbol, '1d', '5y') || [];
      if (candles.length === 0) {
        return res.status(404).json({
          error: `No data found for ${symbol}. Please check if it's a valid US ticker.`
        });
      }
      // 計算簡易 MA
      candles = calculateIndicators(candles);
    } else {
      // ── 台股：從 Neon DB 取得
      if (!process.env.DATABASE_URL) {
        return res.status(500).json({ error: 'DATABASE_URL not configured' });
      }

      const sql = neon(process.env.DATABASE_URL);
      let rows;

      // 台股查詢邏輯
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

      candles = rows.map(r => ({
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

      if (candles.length === 0) {
        return res.status(404).json({
          error: `No data found for ${symbol}`
        });
      }
    }

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
