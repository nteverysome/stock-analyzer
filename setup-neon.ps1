# 🇹🇼 自動化 Neon + Vercel 設置腳本 (PowerShell)
# 用途：一鍵完成 Step 1-3

Clear-Host
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "🚀 台灣股市數據庫自動化設置" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# ==================== STEP 1 ====================
Write-Host "📝 [Step 1] 獲取 Neon 連接字符串" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Yellow
Write-Host ""

Write-Host "✅ 即將打開 Neon 控制台..." -ForegroundColor Green
Write-Host "👉 https://console.neon.tech/app/org-dawn-pond-34051145/projects" -ForegroundColor Cyan
Write-Host ""
Write-Host "等待 2 秒..." -ForegroundColor Gray
Start-Sleep -Seconds 2

# 打開瀏覽器
Start-Process "https://console.neon.tech/app/org-dawn-pond-34051145/projects" | Out-Null

Write-Host "✅ 已打開 Neon 控制台" -ForegroundColor Green
Write-Host ""
Write-Host "📋 操作步驟：" -ForegroundColor Yellow
Write-Host "  1. 選擇你的項目" -ForegroundColor White
Write-Host "  2. 複製 PostgreSQL 連接字符串（右上角 Connection 按鈕）" -ForegroundColor White
Write-Host "  3. 粘貼到下方提示" -ForegroundColor White
Write-Host ""

$DATABASE_URL = Read-Host "🔑 請粘貼 Neon 連接字符串"

# 驗證格式
if ($DATABASE_URL -notmatch "postgresql://") {
    Write-Host "❌ 錯誤：不是有效的 PostgreSQL 連接字符串" -ForegroundColor Red
    Write-Host "   應該看起來像：postgresql://user:password@host.neon.tech/dbname?sslmode=require" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ 連接字符串已獲取！" -ForegroundColor Green
Write-Host "   格式驗證通過" -ForegroundColor Green
Write-Host ""

# ==================== STEP 2 ====================
Write-Host "⚙️ [Step 2] 設置 Vercel 環境變數" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Yellow
Write-Host ""

Write-Host "📋 手動設置步驟：" -ForegroundColor Yellow
Write-Host ""
Write-Host "  1. 打開 Vercel Dashboard：https://vercel.com/dashboard" -ForegroundColor White
Write-Host "  2. 選擇項目：stock-analyzer" -ForegroundColor White
Write-Host "  3. 點擊 Settings" -ForegroundColor White
Write-Host "  4. 左側菜單 → Environment Variables" -ForegroundColor White
Write-Host "  5. 點擊 Add new variable" -ForegroundColor White
Write-Host ""
Write-Host "  變數設置：" -ForegroundColor Cyan
Write-Host "    Name:         DATABASE_URL" -ForegroundColor Cyan
Write-Host "    Value:        [下面已複製]" -ForegroundColor Cyan
Write-Host "    Environments: ✅ Production, Preview, Development" -ForegroundColor Cyan
Write-Host ""

# 複製到剪貼板
$DATABASE_URL | Set-Clipboard
Write-Host "✅ 連接字符串已複製到剪貼板（直接粘貼即可）" -ForegroundColor Green
Write-Host ""

# 打開 Vercel Dashboard
Write-Host "⏳ 即將打開 Vercel Dashboard..." -ForegroundColor Gray
Start-Sleep -Seconds 2
Start-Process "https://vercel.com/dashboard" | Out-Null

Write-Host "✅ 已打開 Vercel Dashboard" -ForegroundColor Green
Write-Host ""

$null = Read-Host "⏳ 按 Enter 鍵繼續（設置完成後）"

Write-Host "✅ 環境變數已設置！" -ForegroundColor Green
Write-Host ""

# ==================== STEP 3 ====================
Write-Host "🗄️ [Step 3] 執行數據庫架構腳本" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Yellow
Write-Host ""

Write-Host "📝 SQL 腳本位置：NEON_DATABASE_SCHEMA.sql" -ForegroundColor White
Write-Host ""
Write-Host "📋 操作步驟：" -ForegroundColor Yellow
Write-Host "  1. 打開 Neon 控制台" -ForegroundColor White
Write-Host "  2. 進入你的項目" -ForegroundColor White
Write-Host "  3. 點擊 SQL Editor 標籤" -ForegroundColor White
Write-Host "  4. 複製本地文件 NEON_DATABASE_SCHEMA.sql 的全部內容（Ctrl+A → Ctrl+C）" -ForegroundColor White
Write-Host "  5. 粘貼到 SQL Editor（Ctrl+V）" -ForegroundColor White
Write-Host "  6. 點擊 Execute 按鈕" -ForegroundColor White
Write-Host "  7. 等待 ✅ 成功提示" -ForegroundColor White
Write-Host ""

Write-Host "⏳ 即將打開 Neon 控制台..." -ForegroundColor Gray
Start-Sleep -Seconds 2
Start-Process "https://console.neon.tech" | Out-Null

Write-Host "✅ 已打開 Neon 控制台" -ForegroundColor Green
Write-Host ""

$null = Read-Host "⏳ 按 Enter 鍵繼續（SQL 執行完成後）"

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "✅ 所有步驟完成！" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# 保存連接字符串到本地文件（用於後續使用）
$DATABASE_URL | Out-File -FilePath ".env.local" -Encoding UTF8
Write-Host "💾 連接字符串已自動保存到 .env.local" -ForegroundColor Yellow
Write-Host ""

Write-Host "📋 下一步（在終端運行）：" -ForegroundColor Yellow
Write-Host ""
Write-Host "  1️⃣ 安裝依賴：" -ForegroundColor Cyan
Write-Host "     npm install @neondatabase/serverless" -ForegroundColor Gray
Write-Host ""
Write-Host "  2️⃣ 驗證連接：" -ForegroundColor Cyan
Write-Host "     node verify-setup.js" -ForegroundColor Gray
Write-Host ""
Write-Host "  3️⃣ 推送到 GitHub：" -ForegroundColor Cyan
Write-Host "     git add ." -ForegroundColor Gray
Write-Host "     git commit -m 'feat: Add Neon PostgreSQL'" -ForegroundColor Gray
Write-Host "     git push origin main" -ForegroundColor Gray
Write-Host ""
Write-Host "  4️⃣ 填充全市場數據（可選）：" -ForegroundColor Cyan
Write-Host "     node scripts/populate-taiwan-stocks.js" -ForegroundColor Gray
Write-Host ""
Write-Host "🎉 祝賀！你的全台灣股市數據庫即將就緒！" -ForegroundColor Green
Write-Host ""
