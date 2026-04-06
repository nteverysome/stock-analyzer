# 繼續補抓數據腳本 (PowerShell)
# 自動檢測進度，繼續補抓直到完成

Write-Host "🚀 繼續補抓數據系統" -ForegroundColor Green
Write-Host "═══════════════════════════════════════" -ForegroundColor Green

Set-Location "c:\Users\Administrator\Desktop\sotke4"

# Step 1: 檢查當前進度
Write-Host ""
Write-Host "📊 Step 1: 檢查當前進度" -ForegroundColor Cyan
Write-Host "─────────────────────" -ForegroundColor Cyan

$priceCount = 0
$indicatorCount = 0

try {
    $output = node -e "const {Pool} = require('@neondatabase/serverless'); require('dotenv').config({path:'.env.local'}); (async()=>{const pool = new Pool({connectionString:process.env.DATABASE_URL,ssl:true}); const client = await pool.connect(); try { const res = await client.query('SELECT COUNT(*) as count FROM tw_daily_prices'); const res2 = await client.query('SELECT COUNT(*) as count FROM tw_indicators'); console.log('PRICE:'+res.rows[0].count); console.log('INDICATOR:'+res2.rows[0].count); } finally { client.release(); await pool.end(); }})()"
    
    foreach ($line in $output) {
        if ($line -like "PRICE:*") {
            $priceCount = [int]$line.Replace("PRICE:", "")
        }
        if ($line -like "INDICATOR:*") {
            $indicatorCount = [int]$line.Replace("INDICATOR:", "")
        }
    }
} catch {
    Write-Host "❌ 無法連接數據庫" -ForegroundColor Red
    exit 1
}

$pricePercent = [math]::Round(($priceCount / 10000000) * 100, 1)
$indicatorPercent = [math]::Round(($indicatorCount / 10000000) * 100, 1)

Write-Host "價格記錄: $priceCount 筆 ($pricePercent%)" -ForegroundColor Yellow
Write-Host "技術指標: $indicatorCount 筆 ($indicatorPercent%)" -ForegroundColor Yellow

Write-Host ""

# Step 2: 決定下一步行動
if ($priceCount -lt 5000000) {
    Write-Host "⏳ Step 2: 繼續補抓數據" -ForegroundColor Yellow
    Write-Host "─────────────────────" -ForegroundColor Yellow
    Write-Host "預計還需 2-4 小時" -ForegroundColor Yellow
    Write-Host ""
    
    node scripts/fetch-5years-history.mjs 2>&1 | Tee-Object -FilePath "backfill_continue.log" -Append
    
    Write-Host "✅ 補抓完成！" -ForegroundColor Green
} else {
    Write-Host "✅ 補抓已完成" -ForegroundColor Green
}

Write-Host ""

# Step 3: 計算指標（如果未完成）
if ($indicatorCount -lt 5000000) {
    Write-Host "⏳ Step 3: 計算技術指標" -ForegroundColor Yellow
    Write-Host "─────────────────────" -ForegroundColor Yellow
    Write-Host "預計還需 2-4 小時" -ForegroundColor Yellow
    Write-Host ""
    
    node scripts/backfill-tw-indicators.mjs --history-full 2>&1 | Tee-Object -FilePath "indicators_continue.log" -Append
    
    Write-Host "✅ 指標計算完成！" -ForegroundColor Green
} else {
    Write-Host "✅ 指標計算已完成" -ForegroundColor Green
}

Write-Host ""
Write-Host "═══════════════════════════════════════" -ForegroundColor Green
Write-Host "🎉 下一步：驗證和測試" -ForegroundColor Green
Write-Host "═══════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "執行驗證：" -ForegroundColor Cyan
Write-Host "  npx vercel dev" -ForegroundColor Yellow
Write-Host "  訪問：http://localhost:3000/verify.html" -ForegroundColor Yellow
Write-Host ""
