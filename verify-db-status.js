#!/usr/bin/env node

import { Pool } from '@neondatabase/serverless';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.resolve(__dirname, '.env.local') });
dotenv.config();

const outputFile = path.join(__dirname, 'db-status.txt');
const output = [];

function log(msg) {
  output.push(msg);
  console.log(msg);
}

async function verify() {
  log('\n================================================');
  log('📊 數據庫狀態驗證');
  log('================================================\n');

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: true,
  });

  try {
    log('🔍 連接中...');
    
    const stocks = await pool.query('SELECT COUNT(*) as count FROM tw_stocks');
    const stockCount = stocks.rows[0].count;
    log(`✅ tw_stocks: ${stockCount} 隻股票`);

    const prices = await pool.query('SELECT COUNT(*) as count FROM tw_daily_prices');
    const priceCount = prices.rows[0].count;
    log(`✅ tw_daily_prices: ${priceCount} 筆記錄`);

    const indicators = await pool.query('SELECT COUNT(*) as count FROM tw_indicators');
    const indicatorCount = indicators.rows[0].count;
    log(`✅ tw_indicators: ${indicatorCount} 筆記錄`);

    log('\n✅ 數據庫連接成功！');
    log(`\n總計: ${stockCount} 隻股票, ${priceCount} 筆價格數據`);

    await pool.end();
    
  } catch (error) {
    log(`❌ 錯誤: ${error.message}`);
    await pool.end();
  }

  // 寫入文件
  fs.writeFileSync(outputFile, output.join('\n'), 'utf8');
  log(`\n結果已保存到: ${outputFile}`);
}

await verify();
process.exit(0);
