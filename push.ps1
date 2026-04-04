# PowerShell 脚本：推送到 GitHub

Write-Host "🚀 开始推送到 GitHub..." -ForegroundColor Green
Write-Host ""

# 进入项目目录
Set-Location "C:\Users\Administrator\Desktop\sotke4"

# 检查 git 状态
Write-Host "📝 检查 git 状态..." -ForegroundColor Cyan
git status

Write-Host ""

# 添加文件
Write-Host "📤 添加文件..." -ForegroundColor Cyan
git add .

Write-Host ""

# 提交
Write-Host "✍️  提交代码..." -ForegroundColor Cyan
git commit -m "feat: Add Taiwan stocks analyzer app - public/tw.html"

Write-Host ""

# 推送
Write-Host "🚀 推送到 GitHub..." -ForegroundColor Cyan
git push origin main

Write-Host ""
Write-Host "✅ 推送完成！" -ForegroundColor Green
Write-Host ""
Write-Host "⏳ Vercel 将在 2-3 分钟内自动部署..." -ForegroundColor Yellow
Write-Host ""
Write-Host "访问应用: https://stock-analyzer.vercel.app/tw.html" -ForegroundColor Cyan
