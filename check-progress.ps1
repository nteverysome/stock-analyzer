# 檢查補抓進度 - 修復亂碼問題
# PowerShell 編碼修復腳本

Write-Host "🔍 檢查補抓進度" -ForegroundColor Green
Write-Host "═══════════════════════════════════════" -ForegroundColor Green
Write-Host ""

Set-Location "c:\Users\Administrator\Desktop\sotke4"

# 方式 1: 直接讀取日誌（修復編碼）
Write-Host "📊 方式 1: 查看補抓日誌（最後 30 行）" -ForegroundColor Cyan
Write-Host "─────────────────────────────────────────" -ForegroundColor Cyan

if (Test-Path "backfill.log") {
    # 使用 UTF-8 編碼讀取，避免亂碼
    $content = Get-Content "backfill.log" -Encoding UTF8 -Tail 30
    if ($content) {
        $content | ForEach-Object { Write-Host $_ }
    } else {
        Write-Host "日誌文件為空，補抓未開始或未生成日誌" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ backfill.log 不存在" -ForegroundColor Red
    Write-Host "請先執行：node scripts/fetch-5years-history.mjs > backfill.log 2>&1" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📊 方式 2: 查看指標計算日誌（最後 30 行）" -ForegroundColor Cyan
Write-Host "─────────────────────────────────────────" -ForegroundColor Cyan

if (Test-Path "indicators.log") {
    $content = Get-Content "indicators.log" -Encoding UTF8 -Tail 30
    if ($content) {
        $content | ForEach-Object { Write-Host $_ }
    } else {
        Write-Host "日誌文件為空，計算未開始或未生成日誌" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ indicators.log 不存在" -ForegroundColor Yellow
    Write-Host "指標計算還未開始" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📊 方式 3: 直接查詢數據庫進度" -ForegroundColor Cyan
Write-Host "─────────────────────────────────────────" -ForegroundColor Cyan

try {
    $output = node -e "
const {Pool} = require('@neondatabase/serverless');
require('dotenv').config({path:'.env.local'});
(async()=>{
  const pool = new Pool({connectionString:process.env.DATABASE_URL,ssl:true});
  const client = await pool.connect();
  try {
    const res = await client.query('SELECT COUNT(*) as count FROM tw_daily_prices');
    const res2 = await client.query('SELECT COUNT(*) as count FROM tw_indicators');
    const res3 = await client.query('SELECT COUNT(DISTINCT symbol) as count FROM tw_daily_prices');
    console.log('價格記錄: ' + res.rows[0].count);
    console.log('技術指標: ' + res2.rows[0].count);
    console.log('覆蓋股票: ' + res3.rows[0].count);
  } catch(e) {
    console.error('錯誤: ' + e.message);
  } finally {
    client.release();
    await pool.end();
  }
})()
" 2>&1

    Write-Host $output -ForegroundColor Yellow
} catch {
    Write-Host "❌ 無法連接數據庫" -ForegroundColor Red
}

Write-Host ""
Write-Host "═══════════════════════════════════════" -ForegroundColor Green
Write-Host "✅ 進度檢查完成" -ForegroundColor Green
Write-Host "═══════════════════════════════════════" -ForegroundColor Green
