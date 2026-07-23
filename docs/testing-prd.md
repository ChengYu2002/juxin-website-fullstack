# Juxin Website — 测试文档（Test Plan / PRD）

> 版本：v1（单元测试层）  ·  最后更新：2026-07-23
> 目的：给出「测了什么、怎么跑、为什么这么测」的单一入口，无需翻源码即可了解测试现状。

---

## 1. 目的与范围

- **定位**：给全栈项目建立一层**扎实、离线、快速**的自动化测试地基，防回归、给重构兜底。
- **本期范围**：**单元测试（Unit）**——纯函数 + 小中间件 + 关键 React 组件。
- **明确不在本期**：API 集成测试、E2E、CI（均已规划，见 §8 路线）。
- **硬约束**：不改动应用运行时源码；测试全程离线（不连数据库、不调 LLM、不发真邮件）；不破坏 lint/build。

---

## 2. 测试分层定位

本项目采用经典测试金字塔，当前已落地**最底层（单元）**：

| 层 | 状态 | 说明 |
|---|---|---|
| Unit（单元） | ✅ 已落地 | 主力层。纯逻辑/中间件/组件，最快、无外部依赖。本文档主体。 |
| Integration / API | ✅ 已落地 | supertest + mongodb-memory-server，打 `app.js`，走完整 HTTP→中间件→controller→service→Mongo 链路。 |
| E2E | ⏸️ 暂不做 | Playwright 冒烟。当前 ROI 低（集成层已覆盖主要风险），作为已知下一步保留。 |
| CI | ✅ 已落地 | GitHub Actions：lint → test → build，LLM 全程不参与。 |
| Agent 行为 eval | ✅ 已有（独立轴） | `scripts/agent-eval.js`，测 LLM 语义行为，**不进 CI**（会 flaky + 烧钱）。 |

---

## 3. 工具选型

| 用途 | 选型 | 理由 |
|---|---|---|
| 测试运行器（前后端统一） | **Vitest** | 前端天然契合 Vite；后端 CommonJS 也能跑。一套心智模型、一套 mock API。 |
| 组件渲染/交互 | **@testing-library/react** + **@testing-library/user-event** | 面向用户行为断言，不测实现细节。 |
| DOM 环境 | **jsdom** | 前端组件/`localStorage` 测试所需。 |
| 断言增强 | **@testing-library/jest-dom** | `toBeInTheDocument` / `toBeDisabled` 等语义断言。 |
| JWT 现签（鉴权测试） | **jsonwebtoken**（已是后端依赖） | 用测试密钥现签真 token，不 mock 库。 |

> 所有测试依赖均为 `devDependencies`，不影响生产构建。

---

## 4. 怎么跑测试

**后端**（`/backend`）

```bash
cd backend
npm test                 # 跑一遍全部：单元 + 集成（vitest run）
npm run test:integration # 只跑集成测试（tests/integration）
npm run test:watch       # 监听模式，改文件自动重跑
npx vitest run tests/requireAdmin.test.js   # 只跑单个文件
npx vitest run -t "过期 token"              # 按用例名过滤
```

> 集成测试首次运行会由 `mongodb-memory-server` 下载一个临时 mongod 二进制（之后本地缓存）。CI 同理。

**前端**（`/frontend`）

```bash
cd frontend
npm test                 # 跑一遍全部
npm run test:watch       # 监听模式
npx vitest run src/utils/imageHost.test.js  # 只跑单个文件
```

**当前基线**：后端 **7 文件 / 52 用例**（单元 34 + 集成 18），前端 **4 文件 / 24 用例**，合计 **76 用例全绿**。

---

## 5. 目录结构

```
backend/
  vitest.config.mjs           # 后端配置（node 环境, globals, NODE_ENV=test）
  tests/
    helpers.js                # 假 req/res 工具（非测试文件，不被收集）
    fastReply.test.js
    clientMeta.test.js
    tools.test.js
    inquiryValidation.test.js
    errorHandler.test.js
    requireAdmin.test.js
frontend/
  vite.config.js              # test 段并入（jsdom, setupFiles）
  vitest.setup.js             # 注入 jest-dom 断言
  src/
    utils/imageHost.test.js
    admin/utils/productModel.test.js
    admin/auth.test.js
    components/ChatWidget/LeadCard.test.jsx
```

---

## 6. 设计原则与安全边界

- **不改源码**：只测已导出的公开接口。未导出的内部函数（如 `has`、`friendlyError`）通过公开面间接覆盖。
- **完全离线、确定性**：
  - 中间件用**假 req/res**（`tests/helpers.js`）直接调用，不起 HTTP 服务。
  - 时间相关逻辑用**假时钟**（`vi.useFakeTimers`）——如 `dedupeInquiry` 的 5 分钟去重窗口。
  - 鉴权用**测试密钥现签 JWT**，不连认证服务。
  - 后端 `NODE_ENV=test`：复用源码 logger 的静音开关，输出干净。
- **测行为、不测实现**：组件测试点按钮、断言用户可见结果（禁用态、提示文案、成功态），不断言内部 state。
- **用例隔离**：共享内存态（如去重 Map）的测试，每条用例用**唯一 IP/邮箱**避免互相污染。

---

## 7. 测试清单（逐文件逐用例）

### 7.1 后端（34）

**`tests/fastReply.test.js` — `isChitchat` 寒暄白名单（5）**

| # | 用例 | 断言意图 |
|---|---|---|
| 1 | 命中常见问候/闲聊（中英） | `你好/hi/谢谢/再见/你是谁` 等 → `true`（走快车道） |
| 2 | 允许句尾标点/波浪线 | `你好！`、`hello~`、`在吗？？` → `true` |
| 3 | 带产品味的句子不命中 | 含型号/规格/推荐 → `false`（回主线更安全） |
| 4 | 超过 20 字不算寒暄 | 长文本 → `false` |
| 5 | 空/非字符串安全兜底 | `''`/空格/`null`/`undefined` → `false` |

**`tests/clientMeta.test.js` — `getClientMeta` 取真实 IP/UA（4）**

| # | 用例 | 断言意图 |
|---|---|---|
| 1 | 优先取 `x-forwarded-for` 第一个 IP 并去空格 | 多级代理头取首段 |
| 2 | 无 XFF → 回退 `req.ip` | |
| 3 | XFF 为空串 → 回退 `req.ip` | |
| 4 | 取 UA；缺省 `unknown` | |

**`tests/tools.test.js` — `trimProduct` 产品瘦身（5）**

| # | 用例 | 断言意图 |
|---|---|---|
| 1 | 只留识别字段 + `path`，丢时间戳等噪音 | 省 token、防幻觉 |
| 2 | `colors` 只取 `variant.label` | |
| 3 | `specs` 只留「填过」的字段，空串/0/null 全剔除 | 别让模型看到空值瞎补 |
| 4 | `features` 有值才给，空数组则不出现 | |
| 5 | 所有 specs 为空 → 输出不含 `specs` | |

**`tests/inquiryValidation.test.js` — 询盘校验 + 去重（8）**

| # | 用例 | 断言意图 |
|---|---|---|
| 1 | 正常输入 → `next()` 且挂 `req.inquiryValidated` | 清洗后数据下传 |
| 2 | 蜜罐 `company` 被填 → 400 bad request | 拦简单机器人 |
| 3 | 缺字段 → 400 missing fields | |
| 4 | 邮箱格式错 → 400 invalid email | |
| 5 | 超长字段被拒（name>120 / email>200 / message>5000） | 防 abuse |
| 6 | 首次放行，紧接同内容 → 429 duplicate | 内存去重 |
| 7 | 不同内容不算重复 → 放行 | |
| 8 | 超 5 分钟窗口后同内容再放行（假时钟） | 窗口过期逻辑 |

**`tests/errorHandler.test.js` — 错误 → HTTP 映射（5）**

| # | 用例 | 断言意图 |
|---|---|---|
| 1 | 业务自定义 `error.status` 优先 | |
| 2 | Mongo `CastError` → 400 malformatted id | |
| 3 | 重复键 `code 11000` → 409 | |
| 4 | `ValidationError` → 400 且透传 message | |
| 5 | 未知错误 → 500 兜底 | 不泄露内部细节 |

**`tests/requireAdmin.test.js` — JWT 鉴权中间件（7）**

| # | 用例 | 断言意图 |
|---|---|---|
| 1 | 缺 Authorization 头 → 401 missing token | |
| 2 | 有 Bearer 但 token 为空 → 401 missing token | |
| 3 | 有效 admin token → `next()` 且挂 `req.admin` | |
| 4 | 角色不是 admin → 403 forbidden | |
| 5 | 用户名不匹配 → 403 forbidden | |
| 6 | 过期 token → 401 token expired | |
| 7 | 乱码 token → 401 invalid token | |

### 7.2 前端（24）

**`src/utils/imageHost.test.js` — `rewriteImageHost` 双链路（5）**

| # | 用例 | 断言意图 |
|---|---|---|
| 1 | CN + CDN 链接 → 改写成 OSS 源站，路径不变 | 国内免跨境 |
| 2 | 海外访客(OW) → 原样返回 | |
| 3 | CN 但非 CDN 域名 → 原样返回 | 不误伤第三方图 |
| 4 | CDN 域名但非以 `host + "/"` 开头 → 不改写 | 防前缀误匹配（安全） |
| 5 | 非字符串输入 → 安全兜底原样返回 | |

**`src/admin/utils/productModel.test.js` — 表单数据规范化（9）**

| # | 分组 | 用例 |
|---|---|---|
| 1 | `emptyProduct` | 给出安全默认结构，避免 undefined/uncontrolled |
| 2 | `normalizeProductData` | 数字字段统一转字符串（moq/sortOrder/pcsPerCarton） |
| 3 | `normalizeProductData` | 数字字段为 null/undefined → 空字符串 |
| 4 | `normalizeProductData` | features 非数组时强制成空数组 |
| 5 | `normalizeProductData` | variants 兼容后端 code/key，且 images 强制数组 |
| 6 | `normalizeProductData` | merge 保留 base 默认（缺省 specs 字段仍在） |
| 7 | images 互转 | 数组 → 每行一个 URL |
| 8 | images 互转 | textarea → 数组：去空白、过滤空行 |
| 9 | images 互转 | 往返稳定（round-trip） |

**`src/admin/auth.test.js` — token 存储（3）**

| # | 用例 | 断言意图 |
|---|---|---|
| 1 | 未设置时 `getAdminToken` 返回 null | |
| 2 | set 后能 get 到同一 token | 写入 `admin_jwt` |
| 3 | clear 后再 get 返回 null | |

**`src/components/ChatWidget/LeadCard.test.jsx` — 留资确认卡（7）**

| # | 用例 | 断言意图 |
|---|---|---|
| 1 | 用 lead 预填三字段（summary → message） | |
| 2 | 邮箱无效 → 禁用发送并提示 | 校验门控 |
| 3 | message 为空 → 禁用发送；补内容后恢复可用 | |
| 4 | name 留空 → 提交占位名 `Website Visitor` | 交互层兜底，不动后端 |
| 5 | 提交成功 → 显示 Sent 确认态 | |
| 6 | 429 错误 → 映射成友好话术，不甩技术原文 | 用户体验 |
| 7 | 点 ✗ → 触发 `onCancel` | |

### 7.3 后端集成（18）

`tests/integration/api.test.js` — supertest 打真实 `app.js` + mongodb-memory-server 临时库。

| 分组 | 用例 | 断言意图 |
|---|---|---|
| `POST /api/inquiries` | 合法提交 → 201 且真的落库 | 主链路 + 持久化 |
| | 后台副作用：geo 回写 country、邮件失败回写 `emailed=failed` | `setImmediate` 副作用 + 三态 |
| | 蜜罐 / 缺字段 / 非法邮箱 → 400 | 校验 |
| | 同 IP 同内容重复 → 429 | 去重 |
| `POST /api/admin/login` | 正确账密 → 200 且返回可验证 JWT | |
| | 密码错误 → 401；缺字段 → 400 | |
| `GET /api/inquiries/admin` | 无 token → 401；有效 token → 200 数组 | 鉴权中间件 |
| `GET /api/products` | 只返回上架、按 sortOrder 降序 | 列表过滤/排序 |
| | 命中 → 200；下架 → 404；不存在 → 404 | |
| `POST /api/chat` | 空 messages / role 非法 / content 非串 → 400 | 入参校验（不触达 LLM） |

**一个值得讲的工程点（Vitest × CommonJS）**：Vitest 的 `vi.mock` 拦不住 app 内部 CJS 模块之间的 `require`（CJS 子树被外部化，深层 require 走原生解析）。所以外部依赖没走模块 mock，而是用**确定生效且离线**的手段替代：
- **geo** 用全局 `fetch`（调用时才取）→ `vi.stubGlobal('fetch', …)` 完全可控、不出网；
- **邮件** 指向 `127.0.0.1:2`（本地无服务）→ 秒级 `ECONNREFUSED` → `emailed='failed'`，顺带覆盖「邮件失败≠提交失败」这条真实逻辑；
- **LLM** 无法干净离线化 → chat happy-path 交给 `scripts/agent-eval.js`，集成层只测 400 校验。

其余关键取舍：**先设 env → 再动态 `import` app**（限流器/uploadController 在 import 时读 env）；每用例独立 `X-Forwarded-For` 规避限流/去重串扰；集成测试文件用 ESM `import`（Vitest 模块处理需要），单元测试仍用 `require`。

---

## 8. 覆盖范围与取舍

**重点覆盖**（价值高、易回归）：输入校验、鉴权、错误→状态码映射、agent 的确定性 helper、关键前端交互与安全兜底（图片改写、留资校验）。

**重点覆盖（集成层新增）**：完整 HTTP 链路的落库/持久化、鉴权中间件、限流去重、错误状态码、产品列表过滤排序。

**本期有意不测**：
- glue/配置代码（`index.js`、`config.js`、路由装配）——收益低。
- S3 上传、真实邮件投递、真实 geo 出网——不在离线测试范围。
- LLM 的语义质量与 chat happy-path——交给独立的 `scripts/agent-eval.js`（另一条轴）。

**覆盖率取向**：不追 100%，把力气压在上面「重点覆盖」区。

---

## 9. 后续路线

1. ~~CI~~ ✅ 已完成：GitHub Actions，`install(缓存) → lint → test → build(前端)`，Node 20，LLM 不参与，`agent-eval` 不进 CI。
2. ~~API 集成层~~ ✅ 已完成：见 §7.3。
3. **E2E（暂不做，作为已知下一步）**：Playwright 冒烟，仅关键 happy path（联系表单提交 / 后台登录 / 打开 ChatWidget）。当前判断：集成层已覆盖主要风险，E2E 成本高、ROI 低，故不铺开；真要加则控制在 1–3 条冒烟。
