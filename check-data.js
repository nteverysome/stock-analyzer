#!/usr/bin/env node

/**
 * 檢查數據庫中的數據狀態
 */

const { Pool } = require('@neondatabase/serverless');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env.local') });
require('dotenv').config();

async function checkData() {
  console.log('\n================================================');
  console.log('📊 數據庫狀態檢查');
  console.log('================================================\n');

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: true,
  });

  try {
    // 檢查股票數量
    const stocks = await pool.query('SELECT COUNT(*) as count FROM tw_stocks');
    console.log(`📈 tw_stocks 表: ${stocks.rows[0].count} 隻股票`);

    // 檢查價格數據數量
    const prices = await pool.query('SELECT COUNT(*) as count FROM tw_daily_prices');
    console.log(`📊 tw_daily_prices 表: ${prices.rows[0].count} 筆記錄`);

    // 檢查指標數據數量
    const indicators = await pool.query('SELECT COUNT(*) as count FROM tw_indicators');
    console.log(`📈 tw_indicators 表: ${indicators.rows[0].count} 筆記錄`);

    // 顯示最新的股票
    const latest = await pool.query(
      'SELECT symbol, name FROM tw_stocks ORDER BY created_at DESC LIMIT 5'
    );
    
    if (latest.rows.length > 0) {
      console.log('\n📌 最新添加的股票:');
      latest.rows.forEach(row => {
        console.log(`   • ${row.symbol} - ${row.name}`);
      });
    }

    console.log('\n================================================');
    console.log('✅ 數據庫連接成功！');
    console.log('================================================\n');

    await pool.end();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ 錯誤:', error.message);
    await pool.end();
    process.exit(1);
  }
}

checkData();
