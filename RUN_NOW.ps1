# 完整歷史數據補抓腳本 (PowerShell)

Write-Host "🚀 開始補抓完整歷史數據" -ForegroundColor Green
Write-Host "═══════════════════════════════════════" -ForegroundColor Green

Set-Location "c:\Users\Administrator\Desktop\sotke4"

# Step 1: 檢查環境
Write-Host ""
Write-Host "📋 Step 1: 檢查環境" -ForegroundColor Cyan
Write-Host "─────────────────────" -ForegroundColor Cyan

node --version
npm --version

if (-not (Test-Path ".env.local")) {
    Write-Host "❌ .env.local 不存在！" -ForegroundColor Red
    exit 1
}
Write-Host "✅ .env.local 已配置" -ForegroundColor Green

# Step 2: 安裝依賴
Write-Host ""
Write-Host "📦 Step 2: 安裝依賴" -ForegroundColor Cyan
Write-Host "─────────────────────" -ForegroundColor Cyan
npm install

# Step 3: 測試補抓（2 支股票）
Write-Host ""
Write-Host "🧪 Step 3: 測試環境（2 支股票，1-2 分鐘）" -ForegroundColor Yellow
Write-Host "─────────────────────────────────────────────" -ForegroundColor Yellow

node scripts/fetch-5years-history.mjs --test

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 測試失敗！" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ 測試成功！環境正常" -ForegroundColor Green

# Step 4: 確認開始補抓
Write-Host ""
Write-Host "🔄 Step 4: 全量補抓（1,962 支股票，3-4 小時）" -ForegroundColor Yellow
Write-Host "─────────────────────────────────────────────" -ForegroundColor Yellow

$confirm = Read-Host "確定要開始補抓嗎？(y/n)"
if ($confirm -ne "y" -and $confirm -ne "Y") {
    Write-Host "已取消" -ForegroundColor Red
    exit 0
}

Write-Host ""
Write-Host "⏳ 補抓開始，預計 3-4 小時完成..." -ForegroundColor Yellow
Write-Host "💡 可以關閉終端，補抓會後台繼續進行" -ForegroundColor Cyan
Write-Host ""

# 後台執行補抓
node scripts/fetch-5years-history.mjs 2>&1 | Tee-Object "backfill.log"

Write-Host ""
Write-Host "✅ 補抓完成！" -ForegroundColor Green

# Step 5: 計算指標
Write-Host ""
Write-Host "📊 Step 5: 計算歷史指標（3-4 小時）" -ForegroundColor Yellow
Write-Host "─────────────────────────────────────" -ForegroundColor Yellow
Write-Host "⏳ 指標計算開始..." -ForegroundColor Yellow
Write-Host ""

node scripts/backfill-tw-indicators.mjs --history-full 2>&1 | Tee-Object "indicators.log"

Write-Host ""
Write-Host "✅ 指標計算完成！" -ForegroundColor Green

# Step 6: 驗證
Write-Host ""
Write-Host "✅ Step 6: 驗證數據" -ForegroundColor Cyan
Write-Host "─────────────────────" -ForegroundColor Cyan

Write-Host ""
Write-Host "═══════════════════════════════════════" -ForegroundColor Green
Write-Host "🎉 完成！" -ForegroundColor Green
Write-Host "═══════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "下一步：本地測試" -ForegroundColor Cyan
Write-Host "npx vercel dev" -ForegroundColor Yellow
Write-Host "訪問：http://localhost:3000/chart.html" -ForegroundColor Yellow
