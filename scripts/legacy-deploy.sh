#!/bin/bash
set -e  # 任何一步报错，立刻停止

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
FRONTEND="$ROOT_DIR/juxin-website-frontend"
BACKEND="$ROOT_DIR/juxin-website-backend"

echo "📤 [0/4] Push frontend source..."
cd "$FRONTEND"
echo "🔎 Frontend branch: $(git rev-parse --abbrev-ref HEAD)"

git add -A
if git diff --cached --quiet; then
  echo "ℹ️ No frontend changes."
else
  git commit -m "feat: update frontend source $(date '+%F %T')"
fi
git push

echo "🔨 [1/4] Build frontend..."
# ✅ 部署/构建更稳：完全按 lock 安装
npm ci
npm run build

echo "📦 [2/4] Copy dist -> backend/dist ..."
rm -rf "$BACKEND/dist"
cp -r dist "$BACKEND/dist"

echo "🚀 [3/4] Commit backend(dist)..."
cd "$BACKEND"
echo "🔎 Backend branch: $(git rev-parse --abbrev-ref HEAD)"

git add -A
if git diff --cached --quiet; then
  echo "ℹ️ No backend changes."
else
  git commit -m "deploy: frontend dist $(date '+%F %T')"
fi
git push

echo "✅ [4/4] Deploy complete!"
