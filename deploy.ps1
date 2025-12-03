# 部署到 GitHub Pages 的脚本 (PowerShell版本)
# 使用方法: .\deploy.ps1 或 npm run deploy

Write-Host "🚀 开始部署到 GitHub Pages..." -ForegroundColor Green

# 1. 构建项目
Write-Host "📦 正在构建项目..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 构建失败！" -ForegroundColor Red
    exit 1
}

# 2. 进入构建输出目录
Set-Location build

# 3. 初始化 git 仓库（如果还没有）
if (-not (Test-Path ".git")) {
    Write-Host "🔧 初始化 Git 仓库..." -ForegroundColor Yellow
    git init
    git checkout -b gh-pages
}

# 4. 添加所有文件
Write-Host "📝 添加文件到 git..." -ForegroundColor Yellow
git add -A

# 5. 提交更改
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
Write-Host "💾 提交更改..." -ForegroundColor Yellow
git commit -m "deploy: $timestamp"

# 6. 推送到 gh-pages 分支
Write-Host "⬆️  推送到 GitHub..." -ForegroundColor Yellow
git push -f https://github.com/JIAXInT/markdown-nice.git gh-pages:gh-pages

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ 部署成功！" -ForegroundColor Green
    Write-Host "🌐 您的网站将会部署到: https://jiaxint.github.io/markdown-nice" -ForegroundColor Cyan
} else {
    Write-Host "❌ 推送失败！" -ForegroundColor Red
    Set-Location ..
    exit 1
}

# 7. 返回项目根目录
Set-Location ..
