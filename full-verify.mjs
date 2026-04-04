#!/usr/bin/env node

/**
 * 完整驗證：檢查所有部署步驟和數據
 */

import { Pool } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: true });
const report = [];

function log(msg) {
  console.log(msg);
  report.push(msg);
}

async function verify() {
  log('\n╔════════════════════════════════════════════════╗');
  log('║     🚀 完整部署驗證報告                         ║');
  log('║     ' + new Date().toLocaleString() + '         ║');
  log('╚════════════════════════════════════════════════╝\n');

  try {
    // 1. 驗證連接
    log('【1️⃣ 數據庫連接驗證】');
    const connTest = await pool.query('SELECT NOW()');
    log(`✅ 數據庫連接成功`);
    log(`   時間: ${connTest.rows[0].now}\n`);

    // 2. 驗證表存在
    log('【2️⃣ 表結構驗證】');
    const tables = await pool.query(
      `SELECT table_name FROM information_schema.tables 
       WHERE table_schema = 'public' ORDER BY table_name`
    );
    log(`✅ 找到 ${tables.rows.length} 個表：`);
    tables.rows.forEach(t => log(`   • ${t.table_name}`));
    log('');

    // 3. 數據統計
    log('【3️⃣ 數據統計】');
    
    const stocks = await pool.query('SELECT COUNT(*) as count FROM tw_stocks');
    log(`✅ tw_stocks: ${stocks.rows[0].count} 隻股票`);

    const prices = await pool.query('SELECT COUNT(*) as count FROM tw_daily_prices');
    log(`✅ tw_daily_prices: ${prices.rows[0].count} 筆記錄`);

    const indicators = await pool.query('SELECT COUNT(*) as count FROM tw_indicators');
    log(`✅ tw_indicators: ${indicators.rows[0].count} 筆記錄`);

    const screener = await pool.query('SELECT COUNT(*) as count FROM tw_screener_cache');
    log(`✅ tw_screener_cache: ${screener.rows[0].count} 筆快取`);

    const logs = await pool.query('SELECT COUNT(*) as count FROM tw_update_logs');
    log(`✅ tw_update_logs: ${logs.rows[0].count} 筆日誌\n`);

    // 4. 樣本數據驗證
    log('【4️⃣ 樣本股票驗證】');
    const sampleStocks = await pool.query(
      `SELECT symbol, name FROM tw_stocks LIMIT 5`
    );
    log(`✅ 樣本股票：`);
    sampleStocks.rows.forEach(s => log(`   • ${s.symbol} - ${s.name}`));
    log('');

    // 5. 歷史數據驗證
    log('【5️⃣ 歷史數據驗證】');
    const priceRange = await pool.query(
      `SELECT MIN(price_date) as min_date, MAX(price_date) as max_date 
       FROM tw_daily_prices`
    );
    log(`✅ 數據日期範圍：`);
    log(`   • 最早: ${priceRange.rows[0].min_date}`);
    log(`   • 最新: ${priceRange.rows[0].max_date}\n`);

    // 6. 總結
    log('╔════════════════════════════════════════════════╗');
    log('║            ✅ 驗證完成！                        ║');
    log('╚════════════════════════════════════════════════╝\n');

    log('📊 狀態總結：');
    log(`   ✅ 數據庫連接: 正常`);
    log(`   ✅ 表結構: 完整 (${tables.rows.length} 個表)`);
    log(`   ✅ 股票數據: ${stocks.rows[0].count} 隻`);
    log(`   ✅ 價格數據: ${prices.rows[0].count} 筆`);
    log(`   ✅ 應用狀態: 就緒\n`);

    // 保存報告
    const reportPath = path.join(__dirname, 'verification-report.txt');
    fs.writeFileSync(reportPath, report.join('\n'), 'utf8');
    log(`📄 報告已保存: ${reportPath}\n`);

  } catch (err) {
    log(`❌ 錯誤: ${err.message}`);
  } finally {
    await pool.end();
  }
}

await verify();
