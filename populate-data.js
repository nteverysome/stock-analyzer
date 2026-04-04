#!/usr/bin/env node

/**
 * 填充台灣股市數據到 Neon 數據庫
 * 運行：node populate-data.js
 */

import { Pool } from '@neondatabase/serverless';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 加載環境變數
dotenv.config({ path: path.resolve(__dirname, '.env.local') });
dotenv.config();

const BATCH_SIZE = 50;
const DELAY = 500;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: true,
});

async function query(sql, values = []) {
  const client = await pool.connect();
  try {
    return await client.query(sql, values);
  } finally {
    client.release();
  }
}

async function fetchAllStocks() {
  console.log('📥 從 FinMind 獲取股票清單...');
  try {
    const res = await fetch('https://api.finmind.ai/api/v4/data?dataset=TaiwanStockInfo');
    const data = await res.json();
    
    if (data.data && Array.isArray(data.data)) {
      console.log(`✅ 獲取 ${data.data.length} 隻股票信息\n`);
      return data.data;
    }
  } catch (err) {
    console.error('❌ 獲取失敗:', err.message);
  }
  return [];
}

async function fetchStockHistory(symbol) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 120);
    const startDateStr = startDate.toISOString().split('T')[0].replace(/-/g, '');

    const res = await fetch(
      `https://api.finmind.ai/api/v4/data?dataset=TaiwanStockPrice&data_id=${symbol}&start_date=${startDateStr}`
    );
    const data = await res.json();
    return data.data || [];
  } catch (err) {
    console.warn(`⚠️ ${symbol}: ${err.message}`);
    return [];
  }
}

async function insertStock(stock) {
  try {
    await query(
      `INSERT INTO tw_stocks (symbol, name, name_en, industry, sector, listed_date)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (symbol) DO UPDATE 
       SET name = $2, updated_at = NOW()`,
      [
        stock.stock_id,
        stock.stock_name,
        stock.stock_name_en || stock.stock_id,
        stock.industry_group || '其他',
        stock.industry || '其他',
        stock.listing_date || null,
      ]
    );
  } catch (err) {
    console.error(`❌ ${stock.stock_id}: ${err.message}`);
  }
}

async function insertPriceHistory(symbol, priceData) {
  let count = 0;
  for (const record of priceData) {
    try {
      await query(
        `INSERT INTO tw_daily_prices (symbol, price_date, open, high, low, close, volume, turnover)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (symbol, price_date) DO NOTHING`,
        [symbol, record.date, record.open, record.high, record.low, record.close, record.volume || 0, record.money || 0]
      );
      count++;
    } catch (err) {
      // 忽略
    }
  }
  return count;
}

async function main() {
  console.log('\n================================================');
  console.log('🚀 開始填充全台灣股市數據');
  console.log('================================================\n');
  
  const startTime = Date.now();
  const stocks = await fetchAllStocks();
  
  if (stocks.length === 0) {
    console.error('❌ 無法獲取股票清單');
    process.exit(1);
  }

  let successCount = 0;
  let totalPrices = 0;

  // 分批處理
  for (let i = 0; i < stocks.length; i += BATCH_SIZE) {
    const batch = stocks.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(stocks.length / BATCH_SIZE);
    
    console.log(`📦 批次 ${batchNum}/${totalBatches}`);

    for (const stock of batch) {
      try {
        await insertStock(stock);
        const priceData = await fetchStockHistory(stock.stock_id);
        const priceCount = await insertPriceHistory(stock.stock_id, priceData);
        console.log(`   ✅ ${stock.stock_id} - ${priceCount} 筆數據`);
        successCount++;
        totalPrices += priceCount;
      } catch (err) {
        console.error(`   ❌ ${stock.stock_id}`);
      }
    }

    if (i + BATCH_SIZE < stocks.length) {
      await new Promise(r => setTimeout(r, DELAY));
    }
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  
  console.log(`
================================================
🎉 填充完成！
================================================
✅ 股票數：${successCount} 隻
✅ 價格記錄：${totalPrices} 筆
⏱️  執行時間：${duration}s
================================================\n`);

  await pool.end();
  process.exit(0);
}

main().catch(err => {
  console.error('❌ 致命錯誤:', err.message);
  process.exit(1);
});
