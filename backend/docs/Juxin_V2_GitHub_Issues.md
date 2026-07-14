# Juxin Manufacturing Website  
## V2 GitHub Issues 拆分文档（Final）

---

## Epic：V2 商业可用全栈系统

**目标**  
将 V1 升级为一个可真实运营、可维护、具备工程成熟度的全栈系统。

**Definition of Done**
- 后台 UI 可用
- 前后端独立部署
- 产品可管理
- 线上问题可定位
- 核心流程有测试兜底

---

# P0（必须完成）

## P0-1 Admin Auth / JWT 基础认证
**Type**: Backend  

**目标**
为所有 admin 功能提供正式、安全的身份认证。

**任务**
- 创建 admin 用户模型
- bcrypt 密码哈希
- 登录 API
- JWT 签发
- middleware 保护 `/api/admin/*`
- 登录接口限流

**验收标准**
- 未登录 → 401
- token 无效 → 401
- 正确登录可访问 admin API
- 无明文密码

---

## P0-2 Products CRUD（Admin）
**Type**: Backend  

**任务**
- Product schema
- CRUD API
- 分页
- 软删除（isActive）

**验收标准**
- 非 admin 无权限
- 校验失败返回 400
- 公共接口仅返回 isActive 产品

---

## P0-3 Admin UI – Login
**Type**: Frontend  

**任务**
- `/admin/login` 页面
- 登录表单
- 错误提示
- 登录成功跳转

**验收标准**
- 错误凭据无法登录
- 正确登录进入后台

---

## P0-4 Admin UI – Products
**Type**: Frontend  

**任务**
- `/admin/products`
- 产品表格
- 新建 / 编辑 / 删除

**验收标准**
- CRUD 可通过 UI 完成
- 页面受登录保护

---

## P0-5 Admin UI – Inquiries
**Type**: Frontend  

**任务**
- `/admin/inquiries`
- 列表展示
- 删除 / 标记已处理

**验收标准**
- 数据正常加载
- 操作生效

---

## P0-6 产品图片 URL 策略
**Type**: Fullstack  

**任务**
- images: string[]
- Admin 通过 URL 管理图片
- 前端 URL 渲染

**禁止**
- MongoDB 存图
- 本地磁盘存图

---

## P0-7 前后端独立部署
**Type**: DevOps  

**任务**
- 前端静态部署
- 后端 API 部署
- `/healthz`
- CORS / trust proxy

---

## P0-8 Product Ordering（sortOrder）
**Type**: DevOps Backend / Frontend

**目标**
支持管理员控制产品在前台列表中的展示顺序，以满足主推产品、爆款产品的业务展示需求。

**任务**

Backend：
- 在 Product schema 中新增字段：
- sortOrder: number
- 为已有产品设置默认 sortOrder 值
- 更新产品列表查询排序规则：
- sortOrder（降序）
- createdAt（降序，作为兜底）
- 支持通过现有产品更新接口修改 sortOrder

Frontend（Admin UI）：
- 在 /admin/products 列表中展示 sortOrder
- 支持管理员编辑 sortOrder
- 修改后通过更新接口保存

**验收标准**
- 前台产品列表按 sortOrder 正确排序
- 后台修改 sortOrder 后，前台顺序立即生效
- 无需删除或重建产品即可调整顺序
- 不影响现有 Products CRUD 功能


# P1（强烈建议）

## P1-1 可观测性（日志 + requestId）
**Type**: Backend  

**任务**
- requestId middleware
- 关键 admin 操作日志

---

## P1-2 DEPLOY.md
**Type**: Docs  

**任务**
- 前端部署
- 后端部署
- `.env.example`

---

## P1-3 E2E Tests（Playwright）
**Type**: Test  

**任务**
- 核心路径测试
- Playwright

---

# P2（可延后）

## P2-1 UI 精修
**Type**: Frontend  

**任务**
- 小范围样式优化

---

## 建议执行顺序
P0 → P1 → P2
