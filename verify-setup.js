/**
 * 🔍 Neon 設置驗證工具
 * 用途：檢查 Step 1-3 是否正確完成
 *
 * 運行：node verify-setup.js
 */

const { Pool } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

// 加載 .env.local
require('dotenv').config({ path: path.resolve(__dirname, '.env.local') });
require('dotenv').config();

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function verify() {
  log('\n================================================', 'cyan');
  log('🔍 Neon 設置驗證工具', 'cyan');
  log('================================================\n', 'cyan');

  // ==================== 驗證 Step 1 ====================
  log('[Step 1] 檢查 Neon 連接字符串', 'yellow');
  log('─'.repeat(50));

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    log('❌ 未找到 DATABASE_URL 環境變數', 'red');
    log('💡 解決方案：設置 Vercel 環境變數或在 .env.local 中設置', 'yellow');
    return;
  }

  if (!dbUrl.includes('postgresql://')) {
    log('❌ DATABASE_URL 格式不正確', 'red');
    log(`   找到：${dbUrl.substring(0, 50)}...`, 'red');
    return;
  }

  log('✅ DATABASE_URL 已設置', 'green');
  log(`   格式：${dbUrl.substring(0, 60)}...`, 'blue');

  // ==================== 驗證 Step 2 ====================
  log('\n[Step 2] 驗證 Vercel 環境變數', 'yellow');
  log('─'.repeat(50));

  if (process.env.VERCEL_ENV) {
    log(`✅ 運行環境：${process.env.VERCEL_ENV}`, 'green');
  } else {
    log('ℹ️  本地開發環境（非 Vercel）', 'cyan');
  }

  // ==================== 驗證 Step 3 ====================
  log('\n[Step 3] 檢查數據庫連接和表結構', 'yellow');
  log('─'.repeat(50));

  let pool;
  try {
    pool = new Pool({
      connectionString: dbUrl,
      ssl: true,
    });

    log('🔄 連接到 Neon PostgreSQL...', 'cyan');
    
    // 測試連接
    const testResult = await pool.query('SELECT NOW()');
    log('✅ 數據庫連接成功！', 'green');

    // 檢查表
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

    log('\n📊 數據庫表檢查：', 'cyan');
    
    let allTablesExist = true;
    expectedTables.forEach(table => {
      const exists = tables.includes(table);
      const status = exists ? '✅' : '❌';
      const color = exists ? 'green' : 'red';
      log(`   ${status} ${table}`, color);
      if (!exists) allTablesExist = false;
    });

    if (!allTablesExist) {
      log('\n⚠️  部分表缺失！', 'red');
      log('💡 解決方案：', 'yellow');
      log('   1. 打開 Neon SQL Editor', 'yellow');
      log('   2. 複製 NEON_DATABASE_SCHEMA.sql 的全部內容', 'yellow');
      log('   3. 粘貼並執行', 'yellow');
      return;
    }

    // 檢查數據
    log('\n📈 數據統計：', 'cyan');
    
    const stockCount = await pool.query('SELECT COUNT(*) as count FROM tw_stocks');
    const priceCount = await pool.query('SELECT COUNT(*) as count FROM tw_daily_prices');
    const indicatorCount = await pool.query('SELECT COUNT(*) as count FROM tw_indicators');

    log(`   ${stockCount.rows[0].count} 隻股票已入庫`, 'blue');
    log(`   ${priceCount.rows[0].count} 筆價格數據`, 'blue');
    log(`   ${indicatorCount.rows[0].count} 筆指標數據`, 'blue');

    // 最終驗證
    log('\n================================================', 'cyan');
    log('🎉 設置驗證完成！', 'green');
    log('================================================\n', 'cyan');

    log('✅ 所有步驟已成功完成：', 'green');
    log('   ✅ Step 1: Neon 連接字符串已配置', 'green');
    log('   ✅ Step 2: Vercel 環境變數已設置', 'green');
    log('   ✅ Step 3: 數據庫架構已初始化', 'green');

    log('\n📋 下一步：', 'yellow');
    log('   1. 運行數據填充腳本：', 'cyan');
    log('      node scripts/populate-taiwan-stocks.js', 'blue');
    log('\n   2. 部署到 Vercel：', 'cyan');
    log('      git push origin main', 'blue');

  } catch (error) {
    log(`\n❌ 數據庫連接失敗：${error.message}`, 'red');
    log('\n💡 故障排查：', 'yellow');
    
    if (error.message.includes('ENOTFOUND')) {
      log('   • 連接字符串中的 host 無法解析', 'yellow');
      log('   • 檢查網絡連接', 'yellow');
    } else if (error.message.includes('ECONNREFUSED')) {
      log('   • 無法連接到數據庫服務器', 'yellow');
      log('   • 檢查 DATABASE_URL 是否正確', 'yellow');
    } else if (error.message.includes('password')) {
      log('   • 認證失敗，檢查用戶名和密碼', 'yellow');
    }
    
    log('\n常見解決方案：', 'yellow');
    log('   1. 確認 DATABASE_URL 已正確設置', 'yellow');
    log('   2. 在 Neon 控制台驗證連接字符串', 'yellow');
    log('   3. 檢查網絡連接（VPN/代理）', 'yellow');

  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

// 執行驗證
verify().catch(err => {
  log(`\n❌ 錯誤：${err.message}`, 'red');
  process.exit(1);
});
