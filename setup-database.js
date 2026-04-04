/**
 * 🗄️ Step 3: 自動執行 SQL 架構腳本
 * 直接連接到 Neon 數據庫並創建所有表
 */

const { Pool } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env.local') });

async function setupDatabase() {
  console.log('\n================================================');
  console.log('🗄️ 數據庫架構初始化 - Step 3');
  console.log('================================================\n');

  const dbUrl = process.env.DATABASE_URL;
  
  if (!dbUrl) {
    console.error('❌ DATABASE_URL 未設置');
    console.log('   請先完成 Step 2 並設置 .env.local');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: dbUrl,
    ssl: true,
  });

  try {
    // 讀取 SQL 架構文件
    console.log('[1/3] 讀取 SQL 架構文件...');
    const sqlFile = path.join(__dirname, 'NEON_DATABASE_SCHEMA_FIXED.sql');
    const sqlContent = fs.readFileSync(sqlFile, 'utf8');
    console.log('✅ SQL 文件已讀取\n');

    // 執行 SQL
    console.log('[2/3] 執行 SQL 架構腳本...');
    const client = await pool.connect();
    
    try {
      await client.query(sqlContent);
      console.log('✅ SQL 執行成功\n');
    } finally {
      client.release();
    }

    // 驗證表
    console.log('[3/3] 驗證數據庫表...');
    const result = await pool.query(
      `SELECT table_name FROM information_schema.tables 
       WHERE table_schema = 'public' 
       ORDER BY table_name`
    );

    const tables = result.rows.map(r => r.table_name);
    const expectedTables = [
      'tw_stocks', 'tw_daily_prices', 'tw_indicators',
      'tw_screener_cache', 'tw_update_logs'
    ];

    let allExist = true;
    expectedTables.forEach(table => {
      const exists = tables.includes(table);
      const status = exists ? '✅' : '❌';
      console.log(`   ${status} ${table}`);
      if (!exists) allExist = false;
    });

    if (allExist) {
      console.log('\n================================================');
      console.log('🎉 Step 3 完成！所有表已創建');
      console.log('================================================\n');
      console.log('✅ 已執行 SQL 架構腳本 ✅ 5 個表已創建\n');
    } else {
      throw new Error('部分表創建失敗');
    }

    await pool.end();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ 執行失敗:', error.message);
    await pool.end();
    process.exit(1);
  }
}

setupDatabase();
