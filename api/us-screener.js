/**
 * /api/us-screener - 美股篩選 API
 * 直接從 Neon 資料庫返回股票 + 最新價格 + 技術指標 + 基本面
 */
import { Pool } from '@neondatabase/serverless';

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'POST or GET only' });
  }
  const { rsi_max, sort_by, limit } = req.method === 'POST' ? (req.body || {}) : (req.query || {});

  try {
    if (!process.env.DATABASE_URL) return res.status(500).json({ error: 'DATABASE_URL not configured' });
    const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: true });
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT 
          s.symbol, s.name, s.sector, s.industry,
          p.close AS price, p.open, p.high, p.low, p.volume, p.price_date,
          prev.close AS prev_close,
          w52.high_52w, w52.low_52w,
          i.rsi, i.kd_fast, i.kd_slow,
          i.macd, i.macd_signal, i.macd_histogram,
          i.ma5, i.ma10, i.ma20, i.ma60, i.ma120,
          f.pe_ttm, f.pe_fwd, f.peg, f.gross_margin, f.operating_margin, f.net_margin,
          f.rev_growth, f.eps_growth, f.analyst_target, f.analyst_low, f.analyst_high,
          f.analyst_count, f.recommendation, f.market_cap, f.dividend_yield,
          f.sector AS fund_sector, f.industry AS fund_industry
        FROM us_stocks s
        LEFT JOIN LATERAL (
          SELECT close, open, high, low, volume, price_date
          FROM us_daily_prices WHERE symbol = s.symbol ORDER BY price_date DESC LIMIT 1
        ) p ON TRUE
        LEFT JOIN LATERAL (
          SELECT close FROM us_daily_prices WHERE symbol = s.symbol ORDER BY price_date DESC OFFSET 1 LIMIT 1
        ) prev ON TRUE
        LEFT JOIN LATERAL (
          SELECT MAX(high) AS high_52w, MIN(low) AS low_52w
          FROM us_daily_prices WHERE symbol = s.symbol AND price_date >= CURRENT_DATE - INTERVAL '365 days'
        ) w52 ON TRUE
        LEFT JOIN LATERAL (
          SELECT rsi, kd_fast, kd_slow, macd, macd_signal, macd_histogram,
                 ma5, ma10, ma20, ma60, ma120
          FROM us_indicators WHERE symbol = s.symbol ORDER BY indicator_date DESC LIMIT 1
        ) i ON TRUE
        LEFT JOIN LATERAL (
          SELECT pe_ttm, pe_fwd, peg, gross_margin, operating_margin, net_margin,
                 rev_growth, eps_growth, analyst_target, analyst_low, analyst_high,
                 analyst_count, recommendation, market_cap, dividend_yield, sector, industry
          FROM us_fundamentals WHERE symbol = s.symbol ORDER BY update_date DESC LIMIT 1
        ) f ON TRUE
        WHERE p.close IS NOT NULL
        ORDER BY f.market_cap DESC NULLS LAST
      `);

      const stocks = result.rows.map(r => {
        const price = parseFloat(r.price) || 0;
        const prevClose = parseFloat(r.prev_close) || price;
        const changePct = prevClose > 0 ? ((price - prevClose) / prevClose * 100) : 0;
        const high52 = parseFloat(r.high_52w) || price;
        const low52 = parseFloat(r.low_52w) || price;
        const w52pos = (high52 > low52) ? (price - low52) / (high52 - low52) : 0.5;
        const pf = v => v != null ? parseFloat(v) : null;
        const pi = v => v != null ? parseInt(v) : null;
        return {
          symbol: r.symbol, name: r.name,
          sector: r.fund_sector || r.sector || '',
          industry: r.fund_industry || r.industry || '',
          price, prev_close: prevClose,
          change_pct: parseFloat(changePct.toFixed(2)),
          volume: parseInt(r.volume) || 0,
          high_52w: high52, low_52w: low52,
          w52_position: parseFloat(w52pos.toFixed(3)),
          rsi: pf(r.rsi), kd_fast: pf(r.kd_fast), kd_slow: pf(r.kd_slow),
          macd: pf(r.macd), macd_signal: pf(r.macd_signal), macd_histogram: pf(r.macd_histogram),
          ma5: pf(r.ma5), ma10: pf(r.ma10), ma20: pf(r.ma20), ma60: pf(r.ma60), ma120: pf(r.ma120),
          price_date: r.price_date,
          has_indicators: r.rsi != null,
          pe_ttm: pf(r.pe_ttm), pe_fwd: pf(r.pe_fwd), peg: pf(r.peg),
          gross_margin: pf(r.gross_margin), operating_margin: pf(r.operating_margin),
          net_margin: pf(r.net_margin), rev_growth: pf(r.rev_growth), eps_growth: pf(r.eps_growth),
          analyst_target: pf(r.analyst_target), analyst_count: pi(r.analyst_count),
          recommendation: r.recommendation,
          market_cap: pi(r.market_cap), dividend_yield: pf(r.dividend_yield),
          has_fundamentals: r.pe_ttm != null || r.gross_margin != null,
        };
      });

      let filtered = stocks;
      if (rsi_max) filtered = filtered.filter(s => s.rsi != null && s.rsi <= +rsi_max);
      if (sort_by === 'rsi') filtered.sort((a, b) => (a.rsi || 999) - (b.rsi || 999));
      else if (sort_by === 'mktcap') filtered.sort((a, b) => (b.market_cap || 0) - (a.market_cap || 0));
      const max = limit ? Math.min(+limit, filtered.length) : filtered.length;

      res.status(200).json({
        success: true, total: stocks.length, filtered: max,
        has_indicators_count: stocks.filter(s => s.has_indicators).length,
        has_fundamentals_count: stocks.filter(s => s.has_fundamentals).length,
        stocks: filtered.slice(0, max),
      });
    } finally { client.release(); await pool.end(); }
  } catch (err) {
    console.error('[us-screener] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
}
