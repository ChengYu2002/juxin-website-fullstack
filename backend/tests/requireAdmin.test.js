// tests/requireAdmin.test.js
// requireAdmin：Bearer JWT 鉴权。无/空 token → 401；角色或用户名不符 → 403；
// 过期 → 401 expired；乱码 → 401 invalid。用测试密钥现签真 token（不改源码）。
const jwt = require('jsonwebtoken')
const { requireAdmin } = require('../src/middleware/requireAdmin')
const { mockReq, mockRes } = require('./helpers')

const SECRET = 'test-secret'
const ADMIN = 'root'

beforeAll(() => {
  process.env.JWT_SECRET = SECRET
  process.env.ADMIN_USERNAME = ADMIN
})

function run(authHeader) {
  const req = mockReq({ headers: authHeader ? { authorization: authHeader } : {} })
  const res = mockRes()
  const next = vi.fn()
  requireAdmin(req, res, next)
  return { req, res, next }
}

function bearer(payload, opts = {}) {
  return 'Bearer ' + jwt.sign(payload, SECRET, opts)
}

describe('requireAdmin', () => {
  it('缺 Authorization 头 → 401 missing token', () => {
    const { res, next } = run(undefined)
    expect(next).not.toHaveBeenCalled()
    expect(res.statusCode).toBe(401)
    expect(res.body.error).toMatch(/missing token/)
  })

  it('有 Bearer 但 token 为空 → 401 missing token', () => {
    const { res } = run('Bearer ')
    expect(res.statusCode).toBe(401)
    expect(res.body.error).toMatch(/missing token/)
  })

  it('有效 admin token → next()，并挂 req.admin', () => {
    const { req, res, next } = run(bearer({ username: ADMIN, role: 'admin' }))
    expect(next).toHaveBeenCalledOnce()
    expect(res.status).not.toHaveBeenCalled()
    expect(req.admin).toMatchObject({ username: ADMIN, role: 'admin' })
  })

  it('角色不是 admin → 403 forbidden', () => {
    const { res, next } = run(bearer({ username: ADMIN, role: 'user' }))
    expect(next).not.toHaveBeenCalled()
    expect(res.statusCode).toBe(403)
  })

  it('用户名不匹配 → 403 forbidden', () => {
    const { res } = run(bearer({ username: 'intruder', role: 'admin' }))
    expect(res.statusCode).toBe(403)
  })

  it('过期 token → 401 token expired', () => {
    const { res } = run(bearer({ username: ADMIN, role: 'admin' }, { expiresIn: -10 }))
    expect(res.statusCode).toBe(401)
    expect(res.body.error).toMatch(/expired/)
  })

  it('乱码 token → 401 invalid token', () => {
    const { res } = run('Bearer not.a.jwt')
    expect(res.statusCode).toBe(401)
    expect(res.body.error).toMatch(/invalid token/)
  })
})
