/**
 * 🔍 簡化的 Neon 連接測試
 * 相容 CommonJS 和 PowerShell
 */

const { Pool } = require('@neondatabase/serverless');
const path = require('path');

// 優先加載 .env.local（開發環境）
require('dotenv').config({ path: path.resolve(__dirname, '.env.local') });
// 然後加載 .env 作為備選
require('dotenv').config();

async function testConnection() {
  console.log('\n================================================');
  console.log('🔍 Neon PostgreSQL 連接測試');
  console.log('================================================\n');

  // 1. 檢查環境變數
  console.log('[1/3] 檢查 DATABASE_URL...');
  const dbUrl = process.env.DATABASE_URL;
  
  if (!dbUrl) {
    console.error('❌ DATABASE_URL 未設置');
    console.log('   解決方案：設置 .env.local 或 Vercel 環境變數');
    process.exit(1);
  }

  if (!dbUrl.includes('postgresql://')) {
    console.error('❌ DATABASE_URL 格式不正確');
    console.log('   應該以 postgresql:// 開頭');
    process.exit(1);
  }

  console.log('✅ DATABASE_URL 已設置');
  console.log(`   格式: ${dbUrl.substring(0, 50)}...`);

  // 2. 連接數據庫
  console.log('\n[2/3] 連接 Neon PostgreSQL...');
  
  const pool = new Pool({
    connectionString: dbUrl,
    ssl: true,
  });

  try {
    // 測試基本連接
    const result = await pool.query('SELECT NOW()');
    console.log('✅ 連接成功！');
    console.log(`   時間: ${result.rows[0].now}`);

    // 3. 檢查表
    console.log('\n[3/3] 檢查數據庫表...');
    
    const tableResult = await pool.query(
      `SELECT table_name FROM information_schema.tables 
       WHERE table_schema = 'public' 
       ORDER BY table_name`
    );

    const tables = tableResult.rows.map(r => r.table_name);
    const expectedTables = [
      'tw_stocks',
      'tw_daily_prices',
      'tw_indicators',
      'tw_screener_cache',
      'tw_update_logs',
    ];

    console.log('📊 數據庫表檢查：');
    let allTablesExist = true;
    expectedTables.forEach(table => {
      const exists = tables.includes(table);
      const status = exists ? '✅' : '❌';
      console.log(`   ${status} ${table}`);
      if (!exists) allTablesExist = false;
    });

    if (!allTablesExist) {
      console.error('\n⚠️  部分表缺失！');
      console.log('   解決方案：');
      console.log('   1. 打開 Neon SQL Editor');
      console.log('   2. 執行 NEON_DATABASE_SCHEMA_FIXED.sql');
      process.exit(1);
    }

    // 4. 檢查數據
    console.log('\n📈 數據統計：');
    
    const stockCount = await pool.query('SELECT COUNT(*) as count FROM tw_stocks');
    const priceCount = await pool.query('SELECT COUNT(*) as count FROM tw_daily_prices');
    const indicatorCount = await pool.query('SELECT COUNT(*) as count FROM tw_indicators');

    console.log(`   ${stockCount.rows[0].count} 隻股票已入庫`);
    console.log(`   ${priceCount.rows[0].count} 筆價格數據`);
    console.log(`   ${indicatorCount.rows[0].count} 筆指標數據`);

    // 完成
    console.log('\n================================================');
    console.log('🎉 驗證成功！所有檢查已通過！');
    console.log('================================================\n');

    console.log('✅ 你的 Neon 數據庫已就緒！');
    console.log('✅ 連接已驗證');
    console.log('✅ 架構已初始化');
    console.log('\n下一步：進行 Step 3 - 部署 API\n');

    await pool.end();
    process.exit(0);

  } catch (error) {
    console.error(`\n❌ 連接失敗！`);
    console.error(`   錯誤: ${error.message}`);
    
    console.log('\n💡 故障排查：');
    if (error.message.includes('ENOTFOUND')) {
      console.log('   • 無法解析主機名');
      console.log('   • 檢查網絡連接和 VPN');
    } else if (error.message.includes('ECONNREFUSED')) {
      console.log('   • 無法連接到數據庫');
      console.log('   • 檢查連接字符串是否正確');
    } else if (error.message.includes('password')) {
      console.log('   • 認證失敗');
      console.log('   • 檢查用戶名和密碼');
    }
    
    console.log('\n常見解決方案：');
    console.log('   1. 確認 DATABASE_URL 已正確設置');
    console.log('   2. 在 Neon 控制台驗證連接字符串');
    console.log('   3. 檢查網絡連接（VPN/代理）\n');

    await pool.end();
    process.exit(1);
  }
}

// 執行測試
testConnection();
