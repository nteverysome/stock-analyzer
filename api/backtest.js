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
        const score = computeDailyScore(data, i);
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

// M3 雙引擎動態評分 v3.2 — 回測版本
function computeDailyScore(data, idx) {
  const row = data[idx];
  const rsi = row.rsi ? parseFloat(row.rsi) : null;
  const close = parseFloat(row.close);
  const open = row.open ? parseFloat(row.open) : close;
  const ma20 = row.ma20 ? parseFloat(row.ma20) : null;
  const ma60 = row.ma60 ? parseFloat(row.ma60) : null;
  const macd = row.macd ? parseFloat(row.macd) : null;
  const macdSig = row.macd_signal ? parseFloat(row.macd_signal) : null;

  // 第一階段：基底計分
  let base_max = 0, base_raw = 0;
  base_max += 20;
  if (rsi != null) {
    if (rsi < 20) base_raw += 20;
    else if (rsi < 30) base_raw += 15;
    else if (rsi < 40) base_raw += 8;
  }
  if (macd != null && macdSig != null) {
    base_max += 20;
    const hist = macd - macdSig;
    const prevRow = idx > 0 ? data[idx - 1] : null;
    const prevHist = prevRow && prevRow.macd && prevRow.macd_signal
      ? parseFloat(prevRow.macd) - parseFloat(prevRow.macd_signal) : null;
    if (hist > 0 && (prevHist == null || prevHist <= 0)) base_raw += 20;
    else if (hist < 0 && prevHist != null && hist > prevHist) base_raw += 10;
    else if (hist > 0) base_raw += 20;
  }
  if (ma20 != null) {
    base_max += 15;
    if (ma60 && ma20 > ma60 && close > ma20) base_raw += 15;
    else if (close > ma20) base_raw += 7;
  }
  const baseScore = base_max > 0 ? Math.round((base_raw / base_max) * 100) : 50;

  // 下跌速率
  let velocityMod = 0;
  if (rsi != null && rsi < 40 && idx >= 5) {
    const prevRsi = data[idx - 5].rsi ? parseFloat(data[idx - 5].rsi) : null;
    if (prevRsi != null) {
      const v = (prevRsi - rsi) / 5;
      if (v >= 4) velocityMod = 8;
      else if (v >= 2) velocityMod = 3;
      else if (v > 0) velocityMod = -5;
    }
  }

  // 第二階段：狀態仲裁
  let state = 'NORMAL', modifier = 0, multiplier = 1.0;
  const isRedK = close > open;
  let isAtSupport = false;
  if (ma60 && Math.abs(close - ma60) / ma60 < 0.02) isAtSupport = true;
  if (ma20 && Math.abs(close - ma20) / ma20 < 0.02 && close < ma20) isAtSupport = true;
  const bigMove = row.prev_close ? Math.abs((close - parseFloat(row.prev_close)) / parseFloat(row.prev_close) * 100) > 3 : false;

  if (bigMove) {
    const chg = row.prev_close ? (close - parseFloat(row.prev_close)) / parseFloat(row.prev_close) * 100 : 0;
    if (isRedK && chg > 4 && ma20 && close > ma20) { state = 'VOLCANO_BUY'; modifier = 30; }
    else if (!isRedK && chg < -4 && ma20 && close < ma20) { state = 'VOLCANO_SELLOFF'; multiplier = 0.4; }
  }
  if (isAtSupport && (state === 'NORMAL' || state === 'VOLCANO_WARNING')) {
    if (rsi != null && rsi < 30) { state = 'SNIPER_OVERSOLD'; modifier = 10; }
    else if (rsi != null && rsi <= 45) { state = 'SNIPER_SUPPORT'; modifier = 5; }
  }
  if (state === 'NORMAL' && rsi != null && rsi > 80) { state = 'OVERBOUGHT_PENALTY'; modifier = -15; }

  const sniperStates = ['SNIPER_DIVERGENCE', 'SNIPER_OVERSOLD', 'SNIPER_SUPPORT'];
  const effV = sniperStates.includes(state) ? velocityMod : 0;
  const rawFinal = Math.round(baseScore * multiplier) + modifier + effV;
  return Math.max(0, Math.min(100, rawFinal));
}
