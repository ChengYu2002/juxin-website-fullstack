# Juxin Manufacturing Website  
## V2 完整需求文档（Final）

---

## 1. 版本背景与目标

### 1.1 当前状态（V1 回顾）

V1 已完成：
- 前端基础页面上线
- Inquiry 表单 → MongoDB 存储 → 邮件通知
- 基本防刷（rate limit / honeypot）
- Render 云端成功部署
- 基础 README

### 1.2 V2 版本目标（一句话）

> **将 V1 升级为一个“可真实运营、可维护、可展示工程成熟度”的商业级全栈项目。**

---

## 2. V2 完成定义（Definition of Done）

当且仅当满足以下条件，V2 视为完成：

1. 管理员可以通过后台 UI 完成产品与询盘管理  
2. 前后端独立部署、稳定运行  
3. 产品图片策略不会成为技术债或翻车点  
4. 线上问题可通过日志快速定位  
5. 核心流程有基础 E2E 测试兜底  

---

## 3. 模块与优先级总览

| 模块 | 定位 |
|---|---|
| Admin Auth / JWT | P0 基础 |
| Products CRUD | P0 核心 |
| Products Order | P0 业务逻辑 ｜
| Admin UI | P0 商业可用 |
| 图片 URL 策略 | P0 防翻车 |
| 前后端部署 | P0 / P1 |
| 可观测性（Observability） | P1 工程成熟度 |
| E2E Tests | P1 |
| UI 精修 | P2 |

---

## 4. 功能需求（Functional Requirements）

### 4.1 Admin Auth / JWT（P0 基础）

- bcrypt 密码哈希  
- JWT access token  
- admin API 统一鉴权  
- 登录接口限流  

---

### 4.2 Products CRUD（P0 核心）

```ts
Product {
  id: string                // 系统唯一标识（后端生成）
  model: string             // 产品型号（如 JX-25ZP，业务唯一）
  slug: string              // URL 标识（用于前台路由）

  name: string              // 产品名称
  category: string          // 产品分类
  moq?: number              // 最小起订量（可选）

  variants: Variant[]       // 产品变体（颜色/款式）
  specs?: ProductSpecs      // 产品规格信息（展示用）

  isActive: boolean         // 是否上架
  sortOrder?: number        // 排序权重（数值越大越靠前）

  isPopular?: boolean       // 是否推荐产品（运营字段）
  profitMargin?: 'low' | 'mid' | 'high'  // 利润等级（内部使用）

  createdAt: datetime
  updatedAt: datetime
}

Variant {
  key: string               // 变体唯一标识（如 black）
  label: string             // 展示名称（如 Black）
  images: string[]          // 该变体对应的图片集合
}

ProductSpecs {
  maxSize?: string
  foldedSize?: string
  cartonSize?: string
  pcsPerCarton?: number
  netWeightKg?: number
  grossWeightKg?: number
  wheelSizeMm?: number
  containerLoad?: {
    '20GP'?: number
    '40GP'?: number
    '40HQ'?: number
  }
}
```

支持：Create / Read / Update / Delete（软删除）

---

### 4.3 Products order（P0 商业逻辑）
sortOrder 用于控制产品在前台列表中的展示顺序

排序规则：
- 按 sortOrder 降序 排序（数值越大，优先展示）
- createdAt 降序 作为兜底排序规则

后台管理员可编辑产品的 sortOrder
后台修改 sortOrder 后，前台产品列表顺序应实时更新
该功能不影响现有 Products CRUD 功能与接口行为

---

### 4.4 Admin UI（P0 商业可用）

页面：
- /admin/login
- /admin/products
- /admin/inquiries

表格 + 表单，强调可用性。

---

### 4.5 图片 URL 策略（P0 防翻车）

- 仅存 URL
- 禁止文件上传
- 禁止 Base64 / MongoDB 存图

---

### 4.6 前后端部署（P0 / P1）

- 前端：静态部署，API URL 使用 env
- 后端：独立 API，/healthz
- 提供 DEPLOY.md

---

### 4.7 可观测性（P1）

- requestId
- 关键 admin 操作日志
- health check

---

### 4.8 E2E Tests（P1）

- Playwright
- 覆盖核心业务路径

---

### 4.9 UI 精修（P2）

- 小范围样式调整

---

## 5. 明确不做（V2 边界）

- 文件上传
- RBAC
- CI/CD
- 高并发架构

---

## 6. V2 最终定位

> **父母能用、工程师能维护、面试官能认可的全栈商业项目。**
