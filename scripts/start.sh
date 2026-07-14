#!/bin/bash
# 本地原生开发(最快 HMR):并行启动后端 nodemon + 前端 vite
# 前端 vite 已配置代理 /api -> http://localhost:3001
# 需要 Docker 化整包验证时改用: docker compose --profile dev up
set -e

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "🚀 Starting backend (nodemon)..."
cd "$ROOT_DIR/backend"
npm run dev &

echo "🚀 Starting frontend (vite)..."
cd "$ROOT_DIR/frontend"
npm run dev
