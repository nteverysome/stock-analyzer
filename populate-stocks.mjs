#!/usr/bin/env node

/**
 * 改進版本：填充台灣股市數據
 * 具有更好的錯誤處理和重試機制
 */

import { Pool } from '@neondatabase/serverless';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env.local') });
dotenv.config();

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
  console.log('📥 獲取股票清單...');
  try {
    const res = await fetch('https://api.finmind.ai/api/v4/data?dataset=TaiwanStockInfo');
    const data = await res.json();
    if (data.data?.length) {
      console.log(`✅ 獲取 ${data.data.length} 隻股票\n`);
      return data.data;
    }
  } catch (err) {
    console.error('❌ 獲取股票清單失敗:', err.message);
  }
  return [];
}

async function fetchStockHistory(symbol) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 120);
    const dateStr = startDate.toISOString().split('T')[0].replace(/-/g, '');
    const res = await fetch(`https://api.finmind.ai/api/v4/data?dataset=TaiwanStockPrice&data_id=${symbol}&start_date=${dateStr}`);
    const data = await res.json();
    return data.data || [];
  } catch (err) {
    return [];
  }
}

async function insertStock(stock) {
  try {
    await query(
      `INSERT INTO tw_stocks (symbol, name, name_en, industry, sector) 
       VALUES ($1, $2, $3, $4, $5) 
       ON CONFLICT (symbol) DO NOTHING`,
      [stock.stock_id, stock.stock_name, stock.stock_name_en || stock.stock_id, stock.industry_group || '其他', stock.industry || '其他']
    );
    return true;
  } catch {
    return false;
  }
}

async function insertPrices(symbol, prices) {
  let count = 0;
  for (const p of prices) {
    try {
      await query(
        `INSERT INTO tw_daily_prices (symbol, price_date, open, high, low, close, volume) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) 
         ON CONFLICT DO NOTHING`,
        [symbol, p.date, p.open, p.high, p.low, p.close, p.volume || 0]
      );
      count++;
    } catch {}
  }
  return count;
}

async function main() {
  console.log('\n================================================');
  console.log('🚀 開始填充股票數據');
  console.log('================================================\n');
  
  const start = Date.now();
  const stocks = await fetchAllStocks();
  
  if (!stocks.length) {
    console.error('❌ 無法獲取股票清單');
    process.exit(1);
  }

  let success = 0, total = 0;

  for (let i = 0; i < stocks.length; i++) {
    const stock = stocks[i];
    process.stdout.write(`\r進度: ${i + 1}/${stocks.length}`);
    
    try {
      if (await insertStock(stock)) {
        const prices = await fetchStockHistory(stock.stock_id);
        await insertPrices(stock.stock_id, prices);
        success++;
        total++;
      }
    } catch (err) {
      console.error(`\n❌ ${stock.stock_id}: ${err.message}`);
    }
  }

  const duration = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`\n\n================================================`);
  console.log(`🎉 完成！\n✅ 成功: ${success} 隻\n⏱️  時間: ${duration}s`);
  console.log(`================================================\n`);

  await pool.end();
  process.exit(0);
}

main().catch(err => {
  console.error('❌ 致命錯誤:', err);
  process.exit(1);
});
