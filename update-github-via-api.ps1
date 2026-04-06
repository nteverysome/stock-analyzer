# 用 GitHub REST API 直接更新檔案（不需要本地 git）

Write-Host "🔑 GitHub API 更新工具" -ForegroundColor Cyan
Write-Host ""

# 請使用者輸入 token
$token = Read-Host "請貼上你的 GitHub Personal Access Token (settings > tokens > classic > repo 權限)"

if (-not $token) {
    Write-Host "❌ Token 為空" -ForegroundColor Red
    exit
}

$owner = "nteverysome"
$repo = "stock-analyzer"
$branch = "main"
$headers = @{
    "Authorization" = "token $token"
    "Accept" = "application/vnd.github.v3+json"
}

Write-Host "✅ 連接 GitHub..." -ForegroundColor Green

# 要更新的檔案
$files = @{
    "api/chart-data.js" = @{
        "message" = "Update chart-data API to neon HTTP mode"
        "path" = "api/chart-data.js"
    }
    "api/backtest.js" = @{
        "message" = "Update backtest API to neon HTTP mode"
        "path" = "api/backtest.js"
    }
}

foreach ($file in $files.Keys) {
    Write-Host ""
    Write-Host "📤 更新 $file ..." -ForegroundColor Yellow
    
    # 讀取本地檔案
    $content = Get-Content $file -Raw
    $base64 = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($content))
    
    # 先取得當前的 SHA
    $shaUrl = "https://api.github.com/repos/$owner/$repo/contents/$($files[$file].path)?ref=$branch"
    try {
        $shaResponse = Invoke-WebRequest -Uri $shaUrl -Headers $headers -UseBasicParsing
        $sha = ($shaResponse.Content | ConvertFrom-Json).sha
    } catch {
        Write-Host "⚠️  檔案不存在或無法取得 SHA，將建立新檔案" -ForegroundColor Yellow
        $sha = $null
    }
    
    # 準備 API 請求
    $body = @{
        message = $files[$file].message
        content = $base64
        branch = $branch
    }
    
    if ($sha) {
        $body["sha"] = $sha
    }
    
    $jsonBody = ConvertTo-Json $body
    
    # 發送請求
    $updateUrl = "https://api.github.com/repos/$owner/$repo/contents/$($files[$file].path)"
    try {
        $response = Invoke-WebRequest -Uri $updateUrl -Method PUT -Headers $headers -Body $jsonBody -UseBasicParsing -ContentType "application/json"
        Write-Host "✅ $file 更新成功！" -ForegroundColor Green
    } catch {
        Write-Host "❌ 更新失敗: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "✅ 所有檔案已上傳到 GitHub！" -ForegroundColor Green
Write-Host "⏳ Vercel 將在 60 秒內自動重新部署..." -ForegroundColor Cyan
Write-Host ""
Write-Host "🌐 訪問檢查進度: https://vercel.com/minamisums-projects/stock-analyzer-qfks/deployments" -ForegroundColor Cyan
