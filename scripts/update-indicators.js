/**
 * 每晚 23:00 自動執行：爬取台股數據 + 計算指標 + 推送到 Redis
 * 用途：為 `/api/indicators` 提供預先計算的 M1-M5 數據
 * 
 * 執行方式 1（GitHub Actions）：.github/workflows/update-indicators.yml
 * 執行方式 2（Vercel Cron）：vercel.json 配置 cron function
 */

import { Redis } from '@upstash/redis';
import fetch from 'node-fetch';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// 292 隻台股清單（示意，實際應從 FinMind 或本地清單讀取）
const TAIWAN_STOCKS = [
  '2330', '2317', '2454', '2308', '2382', '2891', '1101', '1301', '2002', '0050',
  // ... 更多 282 隻股票
];

/**
 * 從 FinMind API 獲取單隻股票數據
 */
async function fetchStockDataFromFinMind(symbol) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 120); // 取 120 天歷史
    const startDateStr = startDate.toISOString().split('T')[0].replace(/-/g, '');

    const url = `https://api.finmind.ai/api/v4/data?dataset=TaiwanStockPrice&data_id=${symbol}&start_date=${startDateStr}`;
    const res = await fetch(url, { timeout: 5000 });
    const json = await res.json();

    return json.data || [];
  } catch (err) {
    console.error(`Error fetching ${symbol}:`, err.message);
    return [];
  }
}

/**
 * 計算移動平均線（M1-M5）
 */
function calculateMovingAverages(prices) {
  const sma = (arr, period) => {
    if (arr.length < period) return null;
    const sum = arr.slice(-period).reduce((a, b) => a + b, 0);
    return (sum / period).toFixed(2);
  };

  const latestPrice = prices[prices.length - 1];
  return {
    m1: sma(prices, 5),   // 5日均線
    m2: sma(prices, 10),  // 10日均線
    m3: sma(prices, 20),  // 20日均線
    m4: sma(prices, 60),  // 60日均線
    m5: sma(prices, 120), // 120日均線
    currentPrice: latestPrice,
  };
}

/**
 * 計算 RSI（相對強度指數）
 */
function calculateRSI(prices, period = 14) {
  if (prices.length < period + 1) return null;

  const changes = [];
  for (let i = 1; i < prices.length; i++) {
    changes.push(prices[i] - prices[i - 1]);
  }

  const gains = changes.filter(c => c > 0).reduce((a, b) => a + b, 0) / period;
  const losses = Math.abs(changes.filter(c => c < 0).reduce((a, b) => a + b, 0) / period);

  const rs = gains / losses;
  const rsi = 100 - (100 / (1 + rs));
  return rsi.toFixed(2);
}

/**
 * 主函數：更新所有股票
 */
async function updateAllIndicators() {
  console.log(`[${new Date().toISOString()}] 開始更新台股指標...`);

  let successCount = 0;
  let failCount = 0;

  for (const symbol of TAIWAN_STOCKS) {
    try {
      // 1. 獲取 OHLCV 數據
      const priceData = await fetchStockDataFromFinMind(symbol);
      if (!priceData || priceData.length === 0) {
        console.warn(`⚠️ ${symbol} - 無數據`);
        failCount++;
        continue;
      }

      // 2. 提取收盤價
      const prices = priceData.map(p => parseFloat(p.close));

      // 3. 計算指標
      const ma = calculateMovingAverages(prices);
      const rsi = calculateRSI(prices);

      // 4. 組合數據
      const indicators = {
        symbol,
        name: priceData[priceData.length - 1].name || symbol,
        price: ma.currentPrice,
        m1: ma.m1,
        m2: ma.m2,
        m3: ma.m3,
        m4: ma.m4,
        m5: ma.m5,
        rsi,
        updatedAt: new Date().toISOString(),
      };

      // 5. 推送到 Redis（TTL 24 小時）
      await redis.setex(`stock:${symbol}`, 86400, JSON.stringify(indicators));
      
      console.log(`✅ ${symbol} - 更新成功`);
      successCount++;
    } catch (err) {
      console.error(`❌ ${symbol} - 錯誤: ${err.message}`);
      failCount++;
    }
  }

  // 6. 推送統計信息
  const summary = {
    success: successCount,
    failed: failCount,
    total: TAIWAN_STOCKS.length,
    timestamp: new Date().toISOString(),
  };

  await redis.set('indicators:summary', JSON.stringify(summary));

  console.log(`
═══════════════════════════════════
✅ 更新完成！
成功: ${successCount} 隻
失敗: ${failCount} 隻
總計: ${TAIWAN_STOCKS.length} 隻
═══════════════════════════════════
  `);

  return summary;
}

// 執行
if (import.meta.url === `file://${process.argv[1]}`) {
  updateAllIndicators()
    .then(summary => {
      console.log('最終統計:', summary);
      process.exit(0);
    })
    .catch(err => {
      console.error('致命錯誤:', err);
      process.exit(1);
    });
}

export { updateAllIndicators };
