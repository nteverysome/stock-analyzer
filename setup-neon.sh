#!/bin/bash
# 🇹🇼 自動化 Neon + Vercel 設置腳本
# 用途：一鍵完成 Step 1-3

set -e  # 任何錯誤即停止

echo "================================================"
echo "🚀 台灣股市數據庫自動化設置"
echo "================================================"
echo ""

# ==================== STEP 1 ====================
echo "📝 [Step 1] 獲取 Neon 連接字符串"
echo "================================================"
echo ""
echo "✅ 打開此 URL（將自動在瀏覽器打開）："
echo "👉 https://console.neon.tech/app/org-dawn-pond-34051145/projects"
echo ""
echo "📋 手動操作："
echo "  1. 選擇你的項目"
echo "  2. 複製 PostgreSQL 連接字符串（Connection string）"
echo "  3. 粘貼到下方提示"
echo ""

read -p "🔑 請粘貼 Neon 連接字符串: " DATABASE_URL

# 驗證格式
if [[ ! $DATABASE_URL =~ postgresql:// ]]; then
  echo "❌ 錯誤：不是有效的 PostgreSQL 連接字符串"
  exit 1
fi

echo "✅ 連接字符串已獲取！"
echo ""

# ==================== STEP 2 ====================
echo "⚙️ [Step 2] 設置 Vercel 環境變數"
echo "================================================"
echo ""
echo "選擇設置方法："
echo "  1. 自動設置（需要 Vercel CLI）"
echo "  2. 手動設置（複製到 Vercel Dashboard）"
echo ""

read -p "選擇 (1 或 2): " setup_method

if [ "$setup_method" == "1" ]; then
  echo ""
  echo "⚡ 嘗試使用 Vercel CLI 自動設置..."
  
  # 檢查 Vercel CLI 是否安裝
  if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI 未安裝，改為方法 2（手動）"
    setup_method="2"
  else
    # 使用 Vercel CLI 設置環境變數
    echo "📡 設置環境變數到 Vercel..."
    vercel env add DATABASE_URL --environment production < <(echo "$DATABASE_URL")
    vercel env add DATABASE_URL --environment preview < <(echo "$DATABASE_URL")
    vercel env add DATABASE_URL --environment development < <(echo "$DATABASE_URL")
    
    echo "✅ 環境變數已設置！"
  fi
fi

if [ "$setup_method" == "2" ]; then
  echo ""
  echo "📋 手動設置步驟："
  echo "  1. 打開：https://vercel.com/dashboard"
  echo "  2. 選擇項目：stock-analyzer"
  echo "  3. Settings → Environment Variables"
  echo "  4. 添加新變數："
  echo ""
  echo "     變數名：DATABASE_URL"
  echo "     值："
  echo "     $DATABASE_URL"
  echo ""
  echo "  5. 選擇環境：Production, Preview, Development"
  echo "  6. 點擊 Save"
  echo ""
  
  read -p "⏳ 按 Enter 鍵繼續（設置完成後）..."
fi

echo "✅ 環境變數已設置！"
echo ""

# ==================== STEP 3 ====================
echo "🗄️ [Step 3] 執行數據庫架構腳本"
echo "================================================"
echo ""
echo "📝 SQL 腳本已保存在：NEON_DATABASE_SCHEMA.sql"
echo ""
echo "✅ 打開 Neon SQL Editor："
echo "👉 https://console.neon.tech/app/org-dawn-pond-34051145/projects"
echo ""
echo "📋 操作步驟："
echo "  1. 進入項目"
echo "  2. 點擊 SQL Editor"
echo "  3. 複製文件 NEON_DATABASE_SCHEMA.sql 的全部內容"
echo "  4. 粘貼到 SQL Editor"
echo "  5. 點擊 Execute"
echo "  6. 等待完成"
echo ""

read -p "⏳ 按 Enter 鍵繼續（執行完成後）..."

echo ""
echo "✅ 檢查數據庫表..."

# 嘗試連接到數據庫驗證
npm install @neondatabase/serverless pg &> /dev/null || true

cat > /tmp/verify-schema.js << 'EOF'
import { Pool } from '@neondatabase/serverless';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: true,
});

async function verify() {
  try {
    const result = await pool.query(
      `SELECT table_name FROM information_schema.tables 
       WHERE table_schema = 'public' 
       ORDER BY table_name`
    );
    
    const tables = result.rows.map(r => r.table_name);
    
    console.log('✅ 數據庫表驗證：');
    const expectedTables = [
      'tw_stocks',
      'tw_daily_prices',
      'tw_indicators',
      'tw_screener_cache',
      'tw_update_logs'
    ];
    
    expectedTables.forEach(table => {
      const exists = tables.includes(table);
      console.log(`   ${exists ? '✅' : '❌'} ${table}`);
    });
    
    if (expectedTables.every(t => tables.includes(t))) {
      console.log('\n🎉 所有表已成功創建！');
    } else {
      console.log('\n⚠️ 某些表缺失，請重新執行 SQL 腳本');
    }
  } catch (err) {
    console.error('❌ 連接錯誤:', err.message);
  }
  
  process.exit(0);
}

verify();
EOF

DATABASE_URL="$DATABASE_URL" node /tmp/verify-schema.js || echo "⚠️ 無法驗證（跳過）"

echo ""
echo "================================================"
echo "✅ 設置完成！"
echo "================================================"
echo ""
echo "下一步："
echo "  1. npm install"
echo "  2. git add ."
echo "  3. git commit -m 'feat: Add Neon PostgreSQL'"
echo "  4. git push origin main"
echo "  5. node scripts/populate-taiwan-stocks.js"
echo ""
echo "🎉 祝賀！你的全台灣股市數據庫即將就緒！"
echo ""
