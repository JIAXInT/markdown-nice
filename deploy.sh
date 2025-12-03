#!/bin/bash

# 部署到 GitHub Pages 的脚本
# 使用方法: bash deploy.sh

set -e # 遇到错误时退出

echo "🚀 开始部署到 GitHub Pages..."

# 1. 构建项目
echo "📦 正在构建项目..."
npm run build

# 2. 进入构建输出目录
cd build

# 3. 初始化 git 仓库（如果还没有）
if [ ! -d ".git" ]; then
  git init
  git checkout -b gh-pages
fi

# 4. 添加所有文件
echo "📝 添加文件到 git..."
git add -A

# 5. 提交更改
echo "💾 提交更改..."
git commit -m "deploy: $(date +'%Y-%m-%d %H:%M:%S')"

# 6. 强制推送到 gh-pages 分支
echo "⬆️ 推送到 GitHub..."
git push -f https://github.com/JIAXInT/markdown-nice.git gh-pages:gh-pages

# 7. 返回项目根目录
cd ..

echo "✅ 部署成功！"
echo "🌐 您的网站将会部署到: https://jiaxint.github.io/markdown-nice"
