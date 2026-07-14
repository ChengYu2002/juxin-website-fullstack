# Juxin Manufacturing Website — Full-Stack (Monorepo)

Dockerized monorepo for the Juxin Manufacturing B2B website. One repo contains the **React frontend**, the **Express/MongoDB backend**, and the **container/deploy tooling** that ties them into a single deployable service.

The backend serves the built frontend, so the whole site runs as **one process on one port** — in dev, in Docker, and on Render.

```
juxin-website-fullstack/
├── Dockerfile              # 多阶段:阶段1编前端 → 阶段2跑后端(前端 dist 烤进镜像)
├── docker-compose.yml      # 本地:web 服务 (+ 可选 mongo，--profile dev)
├── .dockerignore
├── .gitignore
├── .env.example            # 环境变量模板(真 .env 不入库)
├── frontend/               # React 19 + Vite 7(见 frontend/README.md)
├── backend/                # Express 5 + MongoDB(见 backend/README.md)
├── docs/
│   └── agent-prd.html      # 产品需求文档
└── scripts/
    ├── start.sh            # 本地原生开发(nodemon + vite，最快 HMR)
    ├── lint-all.sh         # 前后端一次性 ESLint --fix
    └── legacy-deploy.sh    # 【存档】旧的双 repo 手动部署流程(已被 Docker/Render 取代)
```

---

## 架构:前端打包 + 后端静态托管

运行时始终是同一套模型(与旧部署一致):

1. 前端 `vite build` → `dist/`
2. 后端用 `express.static(dist)` 托管这些静态资源
3. SPA 兜底:任何非 `/api` 请求返回 `index.html`,前端路由(`/products`、`/admin`…)刷新可用
4. `/api/*` 由 Express 路由处理,连接 MongoDB

Docker 只是把「前端打包 + 拷贝 dist」自动化,并让 dist 不再进 git —— 运行方式不变。

---

## 快速开始

### 方式 A:原生开发(最快,推荐日常写代码)

```bash
# 各自安装依赖
cd frontend && npm install && cd ../backend && npm install && cd ..
# 配置后端 .env(见下)
cp .env.example backend/.env   # 填入真实值

# 一键起前后端(vite 代理 /api -> localhost:3001)
bash scripts/start.sh
# 前端 http://localhost:5173 ，后端 http://localhost:3001
```

### 方式 B:Docker(验证整包 / 贴近生产)

```bash
cp .env.example .env           # 填入真实值;MONGODB_URI 用 mongodb://mongo:27017/juxin

# 含本地 mongo 容器,一键自包含:
docker compose --profile dev up --build
# 打开 http://localhost:3001 (前端页面 + /api 同源)
```

> 仅跑应用、连你自己的外部 MongoDB(如 Atlas):把 `.env` 的 `MONGODB_URI` 指向外部库,然后 `docker compose up --build`(不带 `--profile dev`,不起 mongo 容器)。

---

## 环境变量

所有配置见 [`.env.example`](.env.example)。要点:

- **真 `.env` 永不入库**(已被 `.gitignore` 忽略)。
- **前端 `VITE_` 变量会被打包进浏览器**,只能放公开信息(URL / 开关),**绝不放密钥**。
- 密钥(Mongo、JWT、OSS、邮件)只存在于后端 `.env` / Render 环境变量。

---

## 部署(Render)

Render 只用根目录的 **Dockerfile** 构建并运行**一个容器**;`docker-compose.yml` 与 mongo 容器仅本地使用。

1. 把本仓库推到 GitHub
2. Render → New → Web Service → 连接本仓库,Runtime 选 **Docker**
3. 在 Render 后台 **Environment** 里配置所有变量(`MONGODB_URI` 指向 **Atlas**、各密钥)
4. Render 注入 `PORT`,应用已用 `process.env.PORT` 兼容
5. 部署后用 `xxx.onrender.com` 验证,再把自定义域名指过来

数据库始终是外部 MongoDB(Atlas),容器无状态;产品图片存于阿里云 OSS。

---

## 子项目文档

- 前端:[`frontend/README.md`](frontend/README.md)
- 后端:[`backend/README.md`](backend/README.md)
