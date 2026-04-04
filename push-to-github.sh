#!/bin/bash

echo "🚀 準備推送到 GitHub..."
echo ""

cd C:/Users/Administrator/Desktop/sotke4

echo "📝 檢查 git 狀態..."
git status

echo ""
echo "📤 添加文件..."
git add .

echo ""
echo "✍️ 提交代碼..."
git commit -m "feat: Add Taiwan stocks public app at /public/tw.html"

echo ""
echo "🚀 推送到 GitHub..."
git push origin main

echo ""
echo "✅ 推送完成！"
echo "Vercel 會自動部署..."
echo ""
echo "應用地址："
echo "  https://stock-analyzer.vercel.app/tw.html"
