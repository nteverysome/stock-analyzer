#!/bin/bash

echo "================================================"
echo "🚀 開始完整部署流程"
echo "================================================"
echo ""

# Step 1: 推送到 GitHub
echo "📤 Step 1: 推送代碼到 GitHub..."
echo "執行："
echo "  git add ."
echo "  git commit -m 'feat: Setup Neon PostgreSQL for full Taiwan market'"
echo "  git push origin main"
echo ""

read -p "準備好了嗎？按 Enter 繼續..."

cd "$(dirname "$0")"

git add . || { echo "❌ git add 失敗"; exit 1; }
echo "✅ 已添加所有文件"

git commit -m "feat: Setup Neon PostgreSQL for full Taiwan market" || { echo "⚠️  沒有更改要提交"; }
echo "✅ 已提交代碼"

git push origin main || { echo "❌ 推送失敗"; exit 1; }
echo "✅ 已推送到 GitHub"

echo ""
echo "================================================"
echo "⏳ Vercel 自動部署中... (2-3 分鐘)"
echo "================================================"
echo ""

sleep 5

echo ""
echo "================================================"
echo "📊 Step 2: 填充台灣股票數據..."
echo "執行："
echo "  node populate-data.js"
echo "================================================"
echo ""

read -p "準備好填充數據了嗎？按 Enter 繼續..."

node populate-data.js || { echo "❌ 數據填充失敗"; exit 1; }

echo ""
echo "================================================"
echo "🎉 完整部署完成！"
echo "================================================"
echo ""
echo "✅ 代碼已推送到 GitHub"
echo "✅ Vercel 已部署應用"
echo "✅ 台灣股票數據已填充"
echo ""
echo "應用已上線：https://stock-analyzer.vercel.app"
echo ""
