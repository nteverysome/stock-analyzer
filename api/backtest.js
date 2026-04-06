/**
 * /api/backtest - 技術指標回測評分 API（改用 neon HTTP 模式）
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
    let data;

    if (start_date && end_date) {
      data = await sql`
        SELECT
          p.price_date, p.close, p.open,
          i.rsi, i.kd_fast, i.macd, i.macd_signal,
          i.m3 AS ma20, i.m4 AS ma60, i.m5 AS ma120,
          LAG(p.close) OVER (ORDER BY p.price_date) as prev_close,
          LEAD(p.close, 5) OVER (ORDER BY p.price_date) as close_5d_later
        FROM tw_daily_prices p
        LEFT JOIN tw_indicators i ON p.symbol = i.symbol AND p.price_date = i.indicator_date
        WHERE p.symbol = ${symbol} AND p.price_date >= ${start_date} AND p.price_date <= ${end_date}
        ORDER BY p.price_date ASC
      `;
    } else if (start_date) {
      data = await sql`
        SELECT
          p.price_date, p.close, p.open,
          i.rsi, i.kd_fast, i.macd, i.macd_signal,
          i.m3 AS ma20, i.m4 AS ma60, i.m5 AS ma120,
          LAG(p.close) OVER (ORDER BY p.price_date) as prev_close,
          LEAD(p.close, 5) OVER (ORDER BY p.price_date) as close_5d_later
        FROM tw_daily_prices p
        LEFT JOIN tw_indicators i ON p.symbol = i.symbol AND p.price_date = i.indicator_date
        WHERE p.symbol = ${symbol} AND p.price_date >= ${start_date}
        ORDER BY p.price_date ASC
      `;
    } else if (end_date) {
      data = await sql`
        SELECT
          p.price_date, p.close, p.open,
          i.rsi, i.kd_fast, i.macd, i.macd_signal,
          i.m3 AS ma20, i.m4 AS ma60, i.m5 AS ma120,
          LAG(p.close) OVER (ORDER BY p.price_date) as prev_close,
          LEAD(p.close, 5) OVER (ORDER BY p.price_date) as close_5d_later
        FROM tw_daily_prices p
        LEFT JOIN tw_indicators i ON p.symbol = i.symbol AND p.price_date = i.indicator_date
        WHERE p.symbol = ${symbol}
        ORDER BY p.price_date ASC
      `;
    } else {
      data = await sql`
        SELECT
          p.price_date, p.close, p.open,
          i.rsi, i.kd_fast, i.macd, i.macd_signal,
          i.m3 AS ma20, i.m4 AS ma60, i.m5 AS ma120,
          LAG(p.close) OVER (ORDER BY p.price_date) as prev_close,
          LEAD(p.close, 5) OVER (ORDER BY p.price_date) as close_5d_later
        FROM tw_daily_prices p
        LEFT JOIN tw_indicators i ON p.symbol = i.symbol AND p.price_date = i.indicator_date
        WHERE p.symbol = ${symbol}
        ORDER BY p.price_date ASC
      `;
    }

      if (data.length === 0) {
        return res.status(404).json({ error: 'No data found' });
      }

      // 計算每日評分 + 績效
      let buySignals = 0;
      let wins = 0;
      let losses = 0;
      let totalReturn = 0;
      const history = [];

      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const score = computeDailyScore(row);
        const isBuySignal = score >= 65;
        let dayReturn = 0;

        if (isBuySignal && row.close_5d_later) {
          buySignals++;
          dayReturn = ((row.close_5d_later - row.close) / row.close) * 100;
          totalReturn += dayReturn;

          if (dayReturn > 0) wins++;
          else if (dayReturn < 0) losses++;
        }

        history.push({
          date: row.price_date,
          close: parseFloat(row.close),
          score: Math.round(score * 10) / 10,
          isBuySignal,
          rsi: row.rsi ? parseFloat(row.rsi) : null,
          kdFast: row.kd_fast ? parseFloat(row.kd_fast) : null,
          macd: row.macd ? parseFloat(row.macd) : null,
          ma20: row.ma20 ? parseFloat(row.ma20) : null,
          dayReturn: dayReturn ? Math.round(dayReturn * 100) / 100 : null,
        });
      }

      const winRate = buySignals > 0 ? ((wins / buySignals) * 100) : 0;
      const avgReturn = buySignals > 0 ? (totalReturn / buySignals) : 0;

    return res.status(200).json({
      success: true,
      symbol,
      backtest: {
        totalDays: data.length,
        buySignals,
        wins,
        losses,
        winRate: Math.round(winRate * 10) / 10,
        avgReturn: Math.round(avgReturn * 100) / 100,
        totalReturn: Math.round(totalReturn * 10) / 10,
      },
      history,
    });
  } catch (err) {
    console.error('backtest error:', err);
    return res.status(500).json({ error: err.message });
  }
}

function computeDailyScore(row) {
  // 簡化評分邏輯（5 個指標）
  let score = 0;

  // 1. RSI (0-20 分)
  const rsi = row.rsi ? parseFloat(row.rsi) : 50;
  if (rsi < 30) score += 15;
  else if (rsi < 50) score += 10;
  else if (rsi < 70) score += 5;

  // 2. KD (0-20 分)
  const kd = row.kd_fast ? parseFloat(row.kd_fast) : 50;
  if (kd < 30) score += 15;
  else if (kd < 50) score += 10;
  else if (kd < 70) score += 5;

  // 3. MACD (0-20 分)
  const macd = row.macd ? parseFloat(row.macd) : 0;
  const macdSignal = row.macd_signal ? parseFloat(row.macd_signal) : 0;
  if (macd > macdSignal) score += Math.min(15, macd * 2);
  else score += Math.max(0, 10 + macd);

  // 4. 價格位置 (0-20 分)
  const ma20 = row.ma20 ? parseFloat(row.ma20) : row.close;
  const ma60 = row.ma60 ? parseFloat(row.ma60) : row.close;
  const close = parseFloat(row.close);
  if (close > ma20 && ma20 > ma60) score += 15;
  else if (close > ma60) score += 10;

  // 5. 波動性 (0-20 分)
  score += Math.min(20, 10);

  return Math.min(100, score);
}
