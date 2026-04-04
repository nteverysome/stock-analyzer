#!/usr/bin/env node

/**
 * 填充樣本台灣股票數據
 * 使用內置的樣本股票列表 + 簡單的模擬歷史數據
 */

import { Pool } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: true });

// 樣本股票數據（台灣主要股票）
const sampleStocks = [
  { id: '2330', name: '台積電', sector: '電子', industry: '半導體' },
  { id: '2317', name: '鴻海', sector: '電子', industry: '電子零件' },
  { id: '2454', name: '聯發科', sector: '電子', industry: '半導體' },
  { id: '1101', name: '台泥', sector: '營建', industry: '水泥' },
  { id: '1301', name: '台塑', sector: '化學', industry: '化學' },
  { id: '2002', name: '中鋼', sector: '鋼鐵', industry: '鋼鐵' },
  { id: '0050', name: '元大台灣50', sector: 'ETF', industry: 'ETF' },
  { id: '3008', name: '大立光', sector: '電子', industry: '光電' },
  { id: '2881', name: '富邦金', sector: '金融', industry: '金融' },
  { id: '2882', name: '國泰金', sector: '金融', industry: '金融' },
  { id: '1216', name: '統一', sector: '食品', industry: '食品' },
  { id: '1301', name: '台塑', sector: '化學', industry: '化學' },
];

async function query(sql, values = []) {
  const client = await pool.connect();
  try {
    return await client.query(sql, values);
  } finally {
    client.release();
  }
}

async function insertStock(stock) {
  try {
    await query(
      `INSERT INTO tw_stocks (symbol, name, sector, industry) 
       VALUES ($1, $2, $3, $4) 
       ON CONFLICT (symbol) DO NOTHING`,
      [stock.id, stock.name, stock.sector, stock.industry]
    );
    return true;
  } catch (err) {
    console.error(`❌ ${stock.id}: ${err.message}`);
    return false;
  }
}

async function generateSamplePrices(symbol) {
  const prices = [];
  const today = new Date();
  
  // 生成最近 120 天的模擬價格數據
  for (let i = 120; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // 簡單的模擬價格
    const basePrice = 100 + Math.random() * 200;
    const open = basePrice + Math.random() * 10;
    const close = open + (Math.random() - 0.5) * 20;
    const high = Math.max(open, close) + Math.random() * 5;
    const low = Math.min(open, close) - Math.random() * 5;
    
    prices.push({
      date: date.toISOString().split('T')[0],
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume: Math.floor(Math.random() * 10000000),
    });
  }
  
  return prices;
}

async function insertPrices(symbol, prices) {
  let count = 0;
  for (const p of prices) {
    try {
      await query(
        `INSERT INTO tw_daily_prices (symbol, price_date, open, high, low, close, volume) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) 
         ON CONFLICT DO NOTHING`,
        [symbol, p.date, p.open, p.high, p.low, p.close, p.volume]
      );
      count++;
    } catch {}
  }
  return count;
}

async function main() {
  console.log('\n================================================');
  console.log('🚀 填充樣本台灣股票數據');
  console.log('================================================\n');
  
  const start = Date.now();
  let stockCount = 0;
  let priceCount = 0;

  for (const stock of sampleStocks) {
    process.stdout.write(`📈 ${stock.id} (${stock.name})... `);
    
    if (await insertStock(stock)) {
      const prices = await generateSamplePrices(stock.id);
      const inserted = await insertPrices(stock.id, prices);
      priceCount += inserted;
      stockCount++;
      console.log(`✅ ${inserted} 筆數據`);
    } else {
      console.log('⚠️ 已存在');
    }
  }

  const duration = ((Date.now() - start) / 1000).toFixed(1);
  
  console.log(`\n================================================`);
  console.log(`🎉 填充完成！`);
  console.log(`✅ 股票: ${stockCount} 隻`);
  console.log(`✅ 價格記錄: ${priceCount} 筆`);
  console.log(`⏱️  耗時: ${duration}s`);
  console.log(`================================================\n`);

  await pool.end();
  process.exit(0);
}

main().catch(err => {
  console.error('❌ 錯誤:', err.message);
  process.exit(1);
});
