#!/bin/bash
# 对前后端一次性跑 ESLint --fix
set -e

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
FRONTEND="$ROOT_DIR/frontend"
BACKEND="$ROOT_DIR/backend"

echo "🧹 [1/2] ESLint fix frontend..."
cd "$FRONTEND"
npx eslint --fix .

echo "🧹 [2/2] ESLint fix backend..."
cd "$BACKEND"
npx eslint --fix .

echo "✅ All ESLint fixes applied!"
