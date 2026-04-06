#!/bin/bash
# 完整歷史數據補抓腳本

echo "🚀 開始補抓完整歷史數據"
echo "═══════════════════════════════════════"

cd c:\Users\Administrator\Desktop\sotke4

# Step 1: 檢查環境
echo ""
echo "📋 Step 1: 檢查環境"
echo "─────────────────────"
node --version
npm --version

if [ ! -f ".env.local" ]; then
  echo "❌ .env.local 不存在！"
  exit 1
fi
echo "✅ .env.local 已配置"

# Step 2: 安裝依賴
echo ""
echo "📦 Step 2: 安裝依賴"
echo "─────────────────────"
npm install --legacy-peer-deps

# Step 3: 測試補抓（2 支股票）
echo ""
echo "🧪 Step 3: 測試環境（2 支股票，1-2 分鐘）"
echo "─────────────────────────────────────────────"
node scripts/fetch-5years-history.mjs --test

if [ $? -ne 0 ]; then
  echo "❌ 測試失敗！"
  exit 1
fi

echo ""
echo "✅ 測試成功！環境正常"

# Step 4: 全量補抓
echo ""
echo "🔄 Step 4: 全量補抓（1,962 支股票，3-4 小時）"
echo "─────────────────────────────────────────────"
echo "⏳ 補抓開始，預計 3-4 小時完成"
echo "💡 提示：可以關閉終端，補抓會後台繼續進行"
echo ""

node scripts/fetch-5years-history.mjs

echo ""
echo "✅ 補抓完成！"

# Step 5: 計算指標
echo ""
echo "📊 Step 5: 計算歷史指標（3-4 小時）"
echo "─────────────────────────────────────"
echo "⏳ 指標計算開始..."
echo ""

node scripts/backfill-tw-indicators.mjs --history-full

echo ""
echo "✅ 指標計算完成！"

# Step 6: 驗證
echo ""
echo "✅ Step 6: 驗證數據"
echo "─────────────────────"
psql $DATABASE_URL -c "SELECT COUNT(*) FROM tw_daily_prices;"

echo ""
echo "═══════════════════════════════════════"
echo "🎉 完成！"
echo "═══════════════════════════════════════"
echo ""
echo "下一步：本地測試"
echo "npx vercel dev"
echo "訪問：http://localhost:3000/chart.html"
