#!/usr/bin/env node
/**
 * 每日更新台股數據：
 * 1. 從 FinMind 抓取最近 5 天價格 → tw_daily_prices（增量）
 * 2. 用最近 120 天數據重算技術指標 → tw_indicators
 */
import { Pool } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: true });
const client = await pool.connect();
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function fetchFinMind(dataset, params = '') {
  const url = `https://api.finmind.ai/api/v4/data?dataset=${dataset}${params}`;
  const r = await fetch(url, { signal: AbortSignal.timeout(30000) });
  const d = await r.json();
  return d.data || [];
}

try {
  // ── Step 1: 更新價格（最近 5 個交易日）──
  console.log('═══ Step 1: 更新台股價格 ═══');
  const { rows: stocks } = await client.query('SELECT symbol FROM tw_stocks ORDER BY symbol');
  const symbols = stocks.map(r => r.symbol);
  console.log(`  ${symbols.length} 支台股`);

  const startDate = new Date(); startDate.setDate(startDate.getDate() - 7);
  const dateStr = startDate.toISOString().split('T')[0].replace(/-/g, '');
  let priceOk = 0, priceFail = 0;

  for (let i = 0; i < symbols.length; i += 30) {
    const batch = symbols.slice(i, i + 30);
    await Promise.allSettled(batch.map(async sym => {
      try {
        const data = await fetchFinMind('TaiwanStockPrice', `&data_id=${sym}&start_date=${dateStr}`);
        for (const d of data) {
          await client.query(`INSERT INTO tw_daily_prices (symbol,price_date,open,high,low,close,volume)
            VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT(symbol,price_date) DO UPDATE SET
            close=$6,high=$4,low=$5,open=$3,volume=$7`,
            [sym, d.date, d.open, d.max, d.min, d.close, d.Trading_Volume]);
        }
        priceOk++;
      } catch(e) { priceFail++; }
    }));
    if ((i % 300) === 0) console.log(`  [${Math.min(i+30,symbols.length)}/${symbols.length}] ✅${priceOk} ❌${priceFail}`);
    await sleep(500);
  }
  console.log(`✅ 價格更新: ${priceOk} 成功, ${priceFail} 失敗`);

  // ── Step 2: 重算技術指標 ──
  console.log('\n═══ Step 2: 重算技術指標 ═══');
  let indOk = 0, indFail = 0;

  for (let i = 0; i < symbols.length; i += 10) {
    const batch = symbols.slice(i, i + 10);
    await Promise.allSettled(batch.map(async sym => {
      try {
        const { rows } = await client.query(
          `SELECT close, high, low FROM tw_daily_prices WHERE symbol=$1 ORDER BY price_date DESC LIMIT 130`, [sym]);
        if (rows.length < 14) return;
        const closes = rows.map(r => +r.close).reverse();
        const highs = rows.map(r => +r.high).reverse();
        const lows = rows.map(r => +r.low).reverse();
        const ind = computeIndicators(closes, highs, lows);
        const { rows: lastDate } = await client.query(
          `SELECT price_date FROM tw_daily_prices WHERE symbol=$1 ORDER BY price_date DESC LIMIT 1`, [sym]);
        if (!lastDate[0]) return;
        await client.query(`INSERT INTO tw_indicators (symbol,indicator_date,rsi,kd_fast,kd_slow,
          macd,macd_signal,macd_histogram,m1,m2,m3,m4,m5)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
          ON CONFLICT(symbol,indicator_date) DO UPDATE SET
          rsi=$3,kd_fast=$4,kd_slow=$5,macd=$6,macd_signal=$7,macd_histogram=$8,
          m1=$9,m2=$10,m3=$11,m4=$12,m5=$13`,
          [sym, lastDate[0].price_date, ind.rsi, ind.kdK, ind.kdD,
           ind.macd, ind.macdSignal, ind.macdHist,
           ind.ma5, ind.ma10, ind.ma20, ind.ma60, ind.ma120]);
        indOk++;
      } catch(e) { indFail++; }
    }));
    if ((i % 200) === 0) console.log(`  [${Math.min(i+10,symbols.length)}/${symbols.length}] ✅${indOk} ❌${indFail}`);
  }
  console.log(`✅ 指標更新: ${indOk} 成功, ${indFail} 失敗`);
} finally {
  client.release();
  await pool.end();
}

function computeIndicators(closes, highs, lows) {
  const n = closes.length;
  const ma = (arr, p) => p <= n ? arr.slice(n - p).reduce((a, b) => a + b, 0) / p : null;
  // RSI(14)
  let gains = 0, losses = 0;
  const period = Math.min(14, n - 1);
  for (let i = n - period; i < n; i++) {
    const d = closes[i] - closes[i - 1];
    if (d > 0) gains += d; else losses -= d;
  }
  const avgG = gains / period, avgL = losses / period;
  const rsi = avgL === 0 ? 100 : 100 - 100 / (1 + avgG / avgL);
  // KD(9,3,3)
  const kdP = Math.min(9, n);
  const recentH = highs.slice(n - kdP), recentL = lows.slice(n - kdP);
  const hh = Math.max(...recentH), ll = Math.min(...recentL);
  const rsv = hh !== ll ? (closes[n - 1] - ll) / (hh - ll) * 100 : 50;
  const kdK = 50 * 2/3 + rsv / 3;
  const kdD = 50 * 2/3 + kdK / 3;
  // MACD(12,26,9)
  let ema12 = closes[0], ema26 = closes[0];
  const difs = [];
  for (let i = 1; i < n; i++) {
    ema12 = closes[i] * 2/13 + ema12 * 11/13;
    ema26 = closes[i] * 2/27 + ema26 * 25/27;
    difs.push(ema12 - ema26);
  }
  let macdSignal = difs[0] || 0;
  for (let i = 1; i < difs.length; i++) macdSignal = difs[i] * 2/10 + macdSignal * 8/10;
  const macd = difs[difs.length - 1] || 0;
  return {
    rsi, kdK, kdD, macd, macdSignal, macdHist: macd - macdSignal,
    ma5: ma(closes, 5), ma10: ma(closes, 10), ma20: ma(closes, 20),
    ma60: ma(closes, 60), ma120: ma(closes, 120),
  };
}
