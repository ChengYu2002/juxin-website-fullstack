// tests/integration/api.test.js
// API 集成测试：supertest 打真实 app.js，走完整 HTTP→中间件→controller→service→Mongo 链路。
// 数据库用 mongodb-memory-server（进程内临时库，用完即焚，不碰生产库）。
//
// 关于外部依赖的处理（重要）：
//   Vitest 的 vi.mock 拦不住 app 内部 CJS 模块之间的 require（CJS 子树被外部化）。
//   所以这里改用「确定能生效、且离线」的手段：
//     - geo：geo.js 用全局 fetch（调用时才取）→ stubGlobal('fetch') 完全可控、不出网。
//     - 邮件：SMTP 指向 127.0.0.1:2（本地无服务）→ 秒级 ECONNREFUSED → emailed='failed'，
//             正好覆盖「邮件失败 ≠ 提交失败、回写 failed」这条真实生产逻辑，且离线。
//     - LLM：chat happy-path 无法干净离线化 → 交给独立的 scripts/agent-eval.js；
//             集成层只覆盖 chat 的入参校验（400）。
//
// 其它取舍：
//   - 限流器 / uploadController 在 import 时就读 env，必须「先设 env → 再动态 import app」。
//   - 每个用例用独立 X-Forwarded-For IP，避免限流/去重跨用例串扰。

import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest'
import mongoose from 'mongoose'
import request from 'supertest'
import jwt from 'jsonwebtoken'
import { MongoMemoryServer } from 'mongodb-memory-server'

let mongod
let app
let Product
let Inquiry

// 每个用例用不同 IP，规避 rateLimit / slowDown / dedupe 的跨用例污染
let ipCounter = 0
function freshIp() {
  ipCounter++
  return `10.${(ipCounter >> 16) & 255}.${(ipCounter >> 8) & 255}.${ipCounter & 255}`
}
const post = (path) => request(app).post(path).set('X-Forwarded-For', freshIp())
const get = (path) => request(app).get(path).set('X-Forwarded-For', freshIp())

// 轮询等待后台副作用完成（setImmediate → geo/mail/回写）
async function waitFor(fn, timeout = 3000, step = 25) {
  const start = Date.now()
  for (;;) {
    const v = await fn()
    if (v) return v
    if (Date.now() - start > timeout) return null
    await new Promise((r) => setTimeout(r, step))
  }
}

beforeAll(async () => {
  mongod = await MongoMemoryServer.create()
  // 必须在 import app 之前设好：限流器 / uploadController 构造时会读它们
  process.env.MONGODB_URI = mongod.getUri()
  process.env.JWT_SECRET = 'test-secret'
  process.env.ADMIN_USERNAME = 'root'
  process.env.ADMIN_PASSWORD = 'secret123' // 走明文回退分支（未配 hash 时）
  process.env.OSS_BUCKET = 'test-bucket'    // uploadController 加载时强制校验，给 dummy（不测上传，也不连 S3）
  process.env.OSS_ACCESS_KEY_ID = 'test-key'
  process.env.OSS_ACCESS_KEY_SECRET = 'test-secret-key'
  // 邮件：指向本地不存在的端口 → 秒级 ECONNREFUSED，离线且确定性
  process.env.SMTP_HOST = '127.0.0.1'
  process.env.SMTP_PORT = '2'
  // LLM 只需能构造，不真调；给 dummy 值兜底
  process.env.LLM_API_KEY = 'dummy-key-for-tests'
  process.env.LLM_BASE_URL = 'https://example.invalid/v1'

  await mongoose.connect(process.env.MONGODB_URI)

  // 加载 app 会顺带注册所有 mongoose 模型；直接取已注册的，避免二次 import 导致重复编译
  app = (await import('../../src/app.js')).default
  Product = mongoose.model('Product')
  Inquiry = mongoose.model('Inquiry')
}, 60000) // 首次可能要下载 mongod 二进制，给足超时

afterAll(async () => {
  await mongoose.disconnect()
  if (mongod) await mongod.stop()
})

beforeEach(async () => {
  const collections = await mongoose.connection.db.collections()
  for (const c of collections) await c.deleteMany({})
})

// —— 测试数据 ——
function seedProduct(over = {}) {
  return Product.create({
    id: 'jx-100',
    name: 'Shopping Trolley 100',
    category: 'shopping-trolley',
    moq: 1000,
    sortOrder: 0,
    isActive: true,
    variants: [{ key: 'red', label: 'Red', images: [] }],
    ...over,
  })
}

describe('POST /api/inquiries (公开留资)', () => {
  const validBody = { name: 'Alice', email: 'alice@example.com', message: 'Need 500 trolleys' }

  it('合法提交 → 201，并真的落库', async () => {
    const res = await post('/api/inquiries').send(validBody)
    expect(res.status).toBe(201)
    expect(res.body).toMatchObject({ ok: true, emailSent: 'pending' })
    expect(res.body.id).toBeTruthy()

    const inDb = await Inquiry.findById(res.body.id)
    expect(inDb).not.toBeNull()
    expect(inDb.email).toBe('alice@example.com')
  })

  it('后台副作用：geo 回写 country，邮件失败回写 emailed=failed（不阻塞提交）', async () => {
    // geo 走全局 fetch → stub 掉，离线返回可控数据
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: true, json: async () => ({ country_name: 'United States', region: 'California' }) })),
    )
    try {
      const res = await post('/api/inquiries').send(validBody)
      const id = res.body.id
      const done = await waitFor(async () => {
        const doc = await Inquiry.findById(id)
        return doc && doc.emailed !== 'pending' ? doc : null
      })
      expect(done).not.toBeNull()
      expect(done.country).toBe('United States') // geo 副作用已回写
      expect(done.emailed).toBe('failed')         // SMTP 不可达 → 失败，但提交仍成功
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it('蜜罐 company 被填 → 400', async () => {
    const res = await post('/api/inquiries').send({ ...validBody, company: 'bot' })
    expect(res.status).toBe(400)
  })

  it('缺字段 → 400', async () => {
    const res = await post('/api/inquiries').send({ email: 'a@b.com' })
    expect(res.status).toBe(400)
  })

  it('非法邮箱 → 400', async () => {
    const res = await post('/api/inquiries').send({ ...validBody, email: 'nope' })
    expect(res.status).toBe(400)
  })

  it('同 IP 同内容重复提交 → 第二次 429（去重）', async () => {
    const ip = '10.9.9.9'
    const first = await request(app).post('/api/inquiries').set('X-Forwarded-For', ip).send(validBody)
    expect(first.status).toBe(201)
    const second = await request(app).post('/api/inquiries').set('X-Forwarded-For', ip).send(validBody)
    expect(second.status).toBe(429)
  })
})

describe('POST /api/admin/login (管理员登录)', () => {
  it('正确账密 → 200 且返回可验证的 JWT', async () => {
    const res = await post('/api/admin/login').send({ username: 'root', password: 'secret123' })
    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
    const decoded = jwt.verify(res.body.token, process.env.JWT_SECRET)
    expect(decoded).toMatchObject({ username: 'root', role: 'admin' })
  })

  it('密码错误 → 401', async () => {
    const res = await post('/api/admin/login').send({ username: 'root', password: 'wrong' })
    expect(res.status).toBe(401)
  })

  it('缺字段 → 400', async () => {
    const res = await post('/api/admin/login').send({ username: 'root' })
    expect(res.status).toBe(400)
  })
})

describe('受保护路由 GET /api/inquiries/admin', () => {
  function adminToken() {
    return jwt.sign({ username: 'root', role: 'admin' }, process.env.JWT_SECRET)
  }

  it('无 token → 401', async () => {
    const res = await get('/api/inquiries/admin')
    expect(res.status).toBe(401)
  })

  it('有效 token → 200 且返回数组', async () => {
    await post('/api/inquiries').send({ name: 'Bob', email: 'bob@x.com', message: 'hi there' })
    const res = await get('/api/inquiries/admin').set('Authorization', `Bearer ${adminToken()}`)
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    expect(res.body.length).toBeGreaterThanOrEqual(1)
  })
})

describe('GET /api/products (公开产品)', () => {
  it('只返回上架产品，且按 sortOrder 从高到低', async () => {
    await seedProduct({ id: 'jx-low', sortOrder: 10, isActive: true })
    await seedProduct({ id: 'jx-high', sortOrder: 20, isActive: true })
    await seedProduct({ id: 'jx-off', sortOrder: 99, isActive: false })

    const res = await get('/api/products')
    expect(res.status).toBe(200)
    const ids = res.body.map((p) => p.id)
    expect(ids).toEqual(['jx-high', 'jx-low']) // 下架的 jx-off 不出现
  })

  it('按 id 命中上架产品 → 200', async () => {
    await seedProduct({ id: 'jx-160sp' })
    const res = await get('/api/products/jx-160sp')
    expect(res.status).toBe(200)
    expect(res.body.id).toBe('jx-160sp')
  })

  it('下架产品 → 404（视为不存在）', async () => {
    await seedProduct({ id: 'jx-hidden', isActive: false })
    const res = await get('/api/products/jx-hidden')
    expect(res.status).toBe(404)
  })

  it('不存在的 id → 404', async () => {
    const res = await get('/api/products/does-not-exist')
    expect(res.status).toBe(404)
  })
})

// chat happy-path 依赖真实 LLM，无法干净离线化 → 由 scripts/agent-eval.js 覆盖。
// 集成层只验证入参校验（不触达 LLM）。
describe('POST /api/chat (仅入参校验)', () => {
  it('空 messages → 400', async () => {
    const res = await post('/api/chat').send({ messages: [] })
    expect(res.status).toBe(400)
  })

  it('message 格式错（role 非法）→ 400', async () => {
    const res = await post('/api/chat').send({ messages: [{ role: 'system', content: 'x' }] })
    expect(res.status).toBe(400)
  })

  it('message content 非字符串 → 400', async () => {
    const res = await post('/api/chat').send({ messages: [{ role: 'user', content: 123 }] })
    expect(res.status).toBe(400)
  })
})
