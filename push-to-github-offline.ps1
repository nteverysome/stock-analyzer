# 離線 Git 提交腳本 — 在你有網路時執行

Write-Host "🚀 準備提交修改到 GitHub..." -ForegroundColor Cyan
Write-Host ""

# Step 1: 檢查 git 狀態
Write-Host "📝 1️⃣ 檢查修改的檔案..."
git status --short

Write-Host ""
Write-Host "✅ 確認以上檔案已修改? (y/n)" -ForegroundColor Yellow
$confirm = Read-Host
if ($confirm -ne 'y') { exit }

# Step 2: 添加所有修改
Write-Host ""
Write-Host "📝 2️⃣ 添加所有修改..."
git add api/chart-data.js api/backtest.js api/health.js public/chart.html
git status

# Step 3: 提交
Write-Host ""
Write-Host "📝 3️⃣ 提交修改..."
git config --global user.email "admin@localhost"
git config --global user.name "Administrator"
git commit -m "fix: Update API to neon HTTP mode and redesign chart UI"

# Step 4: 推送
Write-Host ""
Write-Host "📝 4️⃣ 推送到 GitHub..."
Write-Host "⚠️  需要網路連線！如果掛住，按 Ctrl+C" -ForegroundColor Yellow
git push origin main

Write-Host ""
Write-Host "✅ 完成！Vercel 將在 60 秒內自動重新部署。" -ForegroundColor Green
Write-Host "🌐 訪問: https://stock-analyzer-qfks.vercel.app/chart.html" -ForegroundColor Cyan
