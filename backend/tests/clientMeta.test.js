// tests/clientMeta.test.js
// getClientMeta：从代理头取真实 IP（x-forwarded-for 第一个），无则回退 req.ip；UA 缺省 'unknown'。
const { getClientMeta } = require('../src/utils/clientMeta')

describe('getClientMeta', () => {
  it('优先取 x-forwarded-for 的第一个 IP，并去空格', () => {
    const req = {
      headers: { 'x-forwarded-for': ' 203.0.113.7 , 70.41.3.18 , 150.172.238.178' },
      ip: '127.0.0.1',
    }
    expect(getClientMeta(req).ip).toBe('203.0.113.7')
  })

  it('无 x-forwarded-for 时回退到 req.ip', () => {
    const req = { headers: {}, ip: '10.0.0.9' }
    expect(getClientMeta(req).ip).toBe('10.0.0.9')
  })

  it('x-forwarded-for 为空串时回退到 req.ip', () => {
    const req = { headers: { 'x-forwarded-for': '' }, ip: '10.0.0.9' }
    expect(getClientMeta(req).ip).toBe('10.0.0.9')
  })

  it('取 user-agent；缺省为 unknown', () => {
    expect(getClientMeta({ headers: { 'user-agent': 'jest/1.0' }, ip: 'x' }).userAgent).toBe('jest/1.0')
    expect(getClientMeta({ headers: {}, ip: 'x' }).userAgent).toBe('unknown')
  })
})
