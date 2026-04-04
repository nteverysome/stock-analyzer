/**
 * /api/tw-screener - 台股篩選 API
 * 直接從 Neon 資料庫返回股票 + 最新價格 + 技術指標
 * 不需要呼叫 Yahoo Finance
 */
import { Pool } from '@neondatabase/serverless';

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'POST or GET only' });
  }

  const { rsi_max, kd_max, sort_by, limit } = req.method === 'POST' ? (req.body || {}) : (req.query || {});

  try {
    if (!process.env.DATABASE_URL) {
      return res.status(500).json({ error: 'DATABASE_URL not configured' });
    }

    const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: true });
    const client = await pool.connect();

    try {
      // 一次性查詢：股票 + 最新價格 + 最新指標 + 52週高低 + 漲跌幅
      const result = await client.query(`
        SELECT 
          s.symbol, s.name, s.industry, s.sector,
          p.close AS price, p.open, p.high, p.low, p.volume, p.price_date,
          prev.close AS prev_close,
          w52.high_52w, w52.low_52w,
          i.rsi, i.kd_fast, i.kd_slow,
          i.macd, i.macd_signal, i.macd_histogram,
          i.m1 AS ma5, i.m2 AS ma10, i.m3 AS ma20, i.m4 AS ma60, i.m5 AS ma120
        FROM tw_stocks s
        LEFT JOIN LATERAL (
          SELECT close, open, high, low, volume, price_date
          FROM tw_daily_prices WHERE symbol = s.symbol
          ORDER BY price_date DESC LIMIT 1
        ) p ON TRUE
        LEFT JOIN LATERAL (
          SELECT close FROM tw_daily_prices WHERE symbol = s.symbol
          ORDER BY price_date DESC OFFSET 1 LIMIT 1
        ) prev ON TRUE
        LEFT JOIN LATERAL (
          SELECT MAX(high) AS high_52w, MIN(low) AS low_52w
          FROM tw_daily_prices
          WHERE symbol = s.symbol AND price_date >= CURRENT_DATE - INTERVAL '365 days'
        ) w52 ON TRUE
        LEFT JOIN LATERAL (
          SELECT rsi, kd_fast, kd_slow, macd, macd_signal, macd_histogram,
                 m1, m2, m3, m4, m5
          FROM tw_indicators WHERE symbol = s.symbol
          ORDER BY indicator_date DESC LIMIT 1
        ) i ON TRUE
        WHERE p.close IS NOT NULL
        ORDER BY s.symbol
      `);

      const stocks = result.rows.map(r => {
        const price = parseFloat(r.price) || 0;
        const prevClose = parseFloat(r.prev_close) || price;
        const changePct = prevClose > 0 ? ((price - prevClose) / prevClose * 100) : 0;
        const high52 = parseFloat(r.high_52w) || price;
        const low52 = parseFloat(r.low_52w) || price;
        const w52pos = (high52 > low52) ? (price - low52) / (high52 - low52) : 0.5;
        const rsi = r.rsi != null ? parseFloat(r.rsi) : null;
        const kd = r.kd_fast != null ? parseFloat(r.kd_fast) : null;
        const macd = r.macd != null ? parseFloat(r.macd) : null;
        const macdSignal = r.macd_signal != null ? parseFloat(r.macd_signal) : null;
        const macdHist = r.macd_histogram != null ? parseFloat(r.macd_histogram) : null;

        return {
          symbol: r.symbol,
          name: r.name,
          industry: r.industry || r.sector || '',
          price,
          prev_close: prevClose,
          change_pct: parseFloat(changePct.toFixed(2)),
          volume: parseInt(r.volume) || 0,
          high_52w: high52,
          low_52w: low52,
          w52_position: parseFloat(w52pos.toFixed(3)),
          rsi,
          kd_fast: kd,
          kd_slow: r.kd_slow != null ? parseFloat(r.kd_slow) : null,
          macd,
          macd_signal: macdSignal,
          macd_histogram: macdHist,
          macd_trend: macdHist != null ? (macdHist > 0 ? '買入' : '賣出') : null,
          ma5: r.ma5 != null ? parseFloat(r.ma5) : null,
          ma10: r.ma10 != null ? parseFloat(r.ma10) : null,
          ma20: r.ma20 != null ? parseFloat(r.ma20) : null,
          ma60: r.ma60 != null ? parseFloat(r.ma60) : null,
          ma120: r.ma120 != null ? parseFloat(r.ma120) : null,
          price_date: r.price_date,
          has_indicators: rsi != null,
        };
      });

      // Server-side filtering
      let filtered = stocks;
      if (rsi_max) filtered = filtered.filter(s => s.rsi != null && s.rsi <= +rsi_max);
      if (kd_max) filtered = filtered.filter(s => s.kd_fast != null && s.kd_fast <= +kd_max);

      // Sort
      if (sort_by === 'rsi') filtered.sort((a, b) => (a.rsi || 999) - (b.rsi || 999));
      else if (sort_by === 'kd') filtered.sort((a, b) => (a.kd_fast || 999) - (b.kd_fast || 999));
      else if (sort_by === 'change') filtered.sort((a, b) => a.change_pct - b.change_pct);
      else if (sort_by === 'volume') filtered.sort((a, b) => b.volume - a.volume);

      const maxResults = limit ? Math.min(+limit, filtered.length) : filtered.length;

      res.status(200).json({
        success: true,
        total: stocks.length,
        filtered: maxResults,
        has_indicators_count: stocks.filter(s => s.has_indicators).length,
        stocks: filtered.slice(0, maxResults),
      });
    } finally {
      client.release();
      await pool.end();
    }
  } catch (err) {
    console.error('[tw-screener] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
}
