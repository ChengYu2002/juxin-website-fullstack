// tests/inquiryValidation.test.js
// validateInquiry：蜜罐 + 必填/邮箱/长度校验，通过则挂 req.inquiryValidated。
// dedupeInquiry：内存 Map，5 分钟内同 ip+name+email+message → 429。用假时钟测窗口。
const { validateInquiry, dedupeInquiry } = require('../src/middleware/inquiryValidation')
const { mockRes } = require('./helpers')

const good = { name: 'Alice', email: 'alice@example.com', message: 'need a quote' }

describe('validateInquiry', () => {
  it('正常输入 → next()，并挂上清洗后的 req.inquiryValidated', () => {
    const req = { body: { ...good, name: '  Alice  ' } }
    const res = mockRes()
    const next = vi.fn()
    validateInquiry(req, res, next)
    expect(next).toHaveBeenCalledOnce()
    expect(res.status).not.toHaveBeenCalled()
    expect(req.inquiryValidated).toEqual({ name: 'Alice', email: 'alice@example.com', message: 'need a quote' })
  })

  it('蜜罐 company 被填 → 400 bad request（拦机器人）', () => {
    const req = { body: { ...good, company: 'bot-inc' } }
    const res = mockRes()
    const next = vi.fn()
    validateInquiry(req, res, next)
    expect(next).not.toHaveBeenCalled()
    expect(res.statusCode).toBe(400)
    expect(res.body).toEqual({ ok: false, error: 'bad request' })
  })

  it('缺字段 → 400 missing fields', () => {
    const res = mockRes()
    validateInquiry({ body: { name: 'A', email: 'a@b.com' } }, res, vi.fn())
    expect(res.statusCode).toBe(400)
    expect(res.body.error).toBe('missing fields')
  })

  it('邮箱格式错 → 400 invalid email', () => {
    const res = mockRes()
    validateInquiry({ body: { ...good, email: 'not-an-email' } }, res, vi.fn())
    expect(res.statusCode).toBe(400)
    expect(res.body.error).toBe('invalid email')
  })

  it('超长字段被拒（name>120 / email>200 / message>5000）', () => {
    const cases = [
      [{ ...good, name: 'a'.repeat(121) }, 'name too long'],
      [{ ...good, email: 'a'.repeat(200) + '@x.com' }, 'email too long'],
      [{ ...good, message: 'm'.repeat(5001) }, 'message too long'],
    ]
    for (const [body, err] of cases) {
      const res = mockRes()
      validateInquiry({ body }, res, vi.fn())
      expect(res.statusCode).toBe(400)
      expect(res.body.error).toBe(err)
    }
  })
})

describe('dedupeInquiry', () => {
  // 每个用例用唯一 ip/email，避免共享的内存 Map 跨用例污染
  function call(ip, validated) {
    const req = { clientMeta: { ip }, inquiryValidated: validated }
    const res = mockRes()
    const next = vi.fn()
    dedupeInquiry(req, res, next)
    return { res, next }
  }

  it('首次提交放行；紧接着同内容 → 429 duplicate', () => {
    const v = { name: 'Bob', email: 'dup1@example.com', message: 'hi' }
    expect(call('1.1.1.1', v).next).toHaveBeenCalledOnce()

    const second = call('1.1.1.1', v)
    expect(second.next).not.toHaveBeenCalled()
    expect(second.res.statusCode).toBe(429)
    expect(second.res.body.error).toBe('duplicate submission')
  })

  it('不同内容（不同 message）不算重复 → 放行', () => {
    const base = { name: 'Bob', email: 'diff@example.com' }
    expect(call('2.2.2.2', { ...base, message: 'first' }).next).toHaveBeenCalledOnce()
    expect(call('2.2.2.2', { ...base, message: 'second' }).next).toHaveBeenCalledOnce()
  })

  it('超过 5 分钟窗口后同内容再次放行（假时钟）', () => {
    vi.useFakeTimers()
    try {
      const v = { name: 'Bob', email: 'window@example.com', message: 'hi' }
      vi.setSystemTime(0)
      expect(call('3.3.3.3', v).next).toHaveBeenCalledOnce()

      // 4 分钟：仍在窗口内 → 拒
      vi.setSystemTime(4 * 60 * 1000)
      expect(call('3.3.3.3', v).res.statusCode).toBe(429)

      // 6 分钟：窗口过期 → 放行
      vi.setSystemTime(6 * 60 * 1000)
      expect(call('3.3.3.3', v).next).toHaveBeenCalledOnce()
    } finally {
      vi.useRealTimers()
    }
  })
})
