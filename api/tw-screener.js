/**
 * /api/tw-screener - 台股篩選 API
 * 直接從 Neon 資料庫返回股票 + 最新價格 + 技術指標
 * 不需要呼叫 Yahoo Finance
 */
import { Pool } from '@neondatabase/serverless';

// 護城河簡易評分：基於毛利率和成長率（0-100 分制）
function calculateMoatScore(gm, om, eps) {
  let score = 50; // 預設中性
  // 毛利率（競爭優勢指標）
  if (gm != null) {
    if (gm >= 50) score += 20;
    else if (gm >= 40) score += 12;
    else if (gm >= 30) score += 5;
  }
  // 營業利率（成本控制能力）
  if (om != null) {
    if (om >= 25) score += 15;
    else if (om >= 15) score += 8;
    else if (om >= 10) score += 3;
  }
  // 成長率（持續擴張能力）
  if (eps != null) {
    if (eps >= 30) score += 15;
    else if (eps >= 20) score += 10;
    else if (eps >= 10) score += 5;
  }
  return Math.min(100, score);
}

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
          i.m1 AS ma5, i.m2 AS ma10, i.m3 AS ma20, i.m4 AS ma60, i.m5 AS ma120,
          f.pe_ttm, f.pe_fwd, f.peg, f.gross_margin, f.operating_margin, f.net_margin,
          f.rev_growth, f.eps_growth, f.analyst_target, f.analyst_low, f.analyst_high,
          f.analyst_count, f.recommendation, f.market_cap, f.dividend_yield,
          f.sector AS fund_sector, f.industry AS fund_industry
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
        LEFT JOIN LATERAL (
          SELECT pe_ttm, pe_fwd, peg, gross_margin, operating_margin, net_margin,
                 rev_growth, eps_growth, analyst_target, analyst_low, analyst_high,
                 analyst_count, recommendation, market_cap, dividend_yield,
                 sector, industry
          FROM tw_fundamentals WHERE symbol = s.symbol
          ORDER BY update_date DESC LIMIT 1
        ) f ON TRUE
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
          open: parseFloat(r.open) || price,
          high: parseFloat(r.high) || price,
          low: parseFloat(r.low) || price,
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
          // 基本面（from tw_fundamentals）
          pe_ttm: r.pe_ttm != null ? parseFloat(r.pe_ttm) : null,
          pe_fwd: r.pe_fwd != null ? parseFloat(r.pe_fwd) : null,
          peg: r.peg != null ? parseFloat(r.peg) : null,
          gross_margin: r.gross_margin != null ? parseFloat(r.gross_margin) : null,
          operating_margin: r.operating_margin != null ? parseFloat(r.operating_margin) : null,
          net_margin: r.net_margin != null ? parseFloat(r.net_margin) : null,
          rev_growth: r.rev_growth != null ? parseFloat(r.rev_growth) : null,
          eps_growth: r.eps_growth != null ? parseFloat(r.eps_growth) : null,
          analyst_target: r.analyst_target != null ? parseFloat(r.analyst_target) : null,
          analyst_count: r.analyst_count != null ? parseInt(r.analyst_count) : null,
          recommendation: r.recommendation,
          market_cap: r.market_cap != null ? parseInt(r.market_cap) : null,
          dividend_yield: r.dividend_yield != null ? parseFloat(r.dividend_yield) : null,
          has_fundamentals: r.pe_ttm != null || r.gross_margin != null,
          // 護城河簡易評分（基於毛利率和成長率）
          moat: calculateMoatScore(
            r.gross_margin ? parseFloat(r.gross_margin) : null,
            r.operating_margin ? parseFloat(r.operating_margin) : null,
            r.eps_growth ? parseFloat(r.eps_growth) : null
          ),
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
