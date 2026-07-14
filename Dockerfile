 # syntax=docker/dockerfile:1

# ---------- 阶段 1:编译前端 ----------
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
# 先只拷 lock/package,命中 Docker 层缓存:改源码不重装依赖
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
# 产出 /app/frontend/dist(用 .env.production 里的 VITE_API_BASE_URL=/api)
RUN npm run build

# ---------- 阶段 2:后端生产运行 ----------
FROM node:20-alpine AS backend
WORKDIR /app
ENV NODE_ENV=production
COPY backend/package*.json ./
RUN npm ci --omit=dev
COPY backend/ ./
# 把前端产物放到后端约定的位置:app.js 用 path.resolve(__dirname,'..','dist') => /app/dist
COPY --from=frontend-build /app/frontend/dist ./dist
# 非 root 运行(安全)
USER node
EXPOSE 3001
# 健康检查:后端根路由返回前端 index.html
HEALTHCHECK --interval=30s --timeout=3s --start-period=20s \
  CMD wget -qO- http://localhost:${PORT:-3001}/ >/dev/null 2>&1 || exit 1
CMD ["node", "src/index.js"]
