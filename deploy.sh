#!/usr/bin/env sh

# 发生错误时终止
set -e

# 构建项目
echo "🚀 开始构建项目..."
npm run build

# 确保 build 目录存在
if [ ! -d "build" ]; then
  echo "❌ 错误: build 目录不存在"
  exit 1
fi

echo "✅ 构建完成"

# 清理 build 目录中的 .git（如果存在），确保每次都是全新的仓库
if [ -d "build/.git" ]; then
  rm -rf build/.git
fi

# 进入构建文件夹
cd build

echo "📦 初始化 Git 仓库..."
# 初始化 git 并提交
git init
git checkout -b gh-pages
git add -A

# 获取当前时间
timestamp=$(date "+%Y-%m-%d %H:%M:%S")
git commit -m "deploy: $timestamp"

# 推送到 gh-pages
echo "⬆️  推送到 GitHub..."
git push -f https://github.com/JIAXInT/markdown-nice.git gh-pages:gh-pages

cd -

echo ""
echo "✅ 部署完成！"
echo "🌐 访问: http://www.justic.xyz/markdown-nice/"
