// tests/errorHandler.test.js
// errorHandler：把各类错误映射成合适的 HTTP 状态码；未知错误兜底 500。
// NODE_ENV=test 时 logger 自动静音（见 vitest.config.mjs），不会刷屏。
const { errorHandler } = require('../src/middleware/errorHandler')
const { mockRes } = require('./helpers')

function run(error) {
  const res = mockRes()
  errorHandler(error, {}, res, vi.fn())
  return res
}

describe('errorHandler', () => {
  it('业务自定义 error.status 优先', () => {
    const res = run(Object.assign(new Error('teapot'), { status: 418 }))
    expect(res.statusCode).toBe(418)
    expect(res.body).toEqual({ ok: false, error: 'teapot' })
  })

  it('Mongo CastError → 400 malformatted id', () => {
    const res = run(Object.assign(new Error('cast'), { name: 'CastError' }))
    expect(res.statusCode).toBe(400)
    expect(res.body.error).toBe('malformatted id')
  })

  it('Mongo 重复键 code 11000 → 409', () => {
    const res = run(Object.assign(new Error('dup'), { code: 11000 }))
    expect(res.statusCode).toBe(409)
    expect(res.body.error).toMatch(/duplicate/i)
  })

  it('ValidationError → 400 且透传 message', () => {
    const res = run(Object.assign(new Error('name required'), { name: 'ValidationError' }))
    expect(res.statusCode).toBe(400)
    expect(res.body.error).toBe('name required')
  })

  it('未知错误 → 500 兜底（不泄露内部细节）', () => {
    const res = run(new Error('some internal boom'))
    expect(res.statusCode).toBe(500)
    expect(res.body).toEqual({ ok: false, error: 'internal server error' })
  })
})
