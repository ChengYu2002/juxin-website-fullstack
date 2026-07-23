// tests/helpers.js
// 轻量 mock：不起服务器，直接用假的 req/res 调中间件。
// 文件名不含 .test. → 不会被 Vitest 当作测试文件收集。

// 假 res：捕获 status/json，链式调用与 Express 一致
function mockRes() {
  const res = { statusCode: 200, body: undefined }
  res.status = vi.fn((code) => {
    res.statusCode = code
    return res
  })
  res.json = vi.fn((payload) => {
    res.body = payload
    return res
  })
  return res
}

// 假 req：headers 不区分大小写，req.get 与 Express 一致
function mockReq({ headers = {}, body = {}, ...rest } = {}) {
  const lower = {}
  for (const [k, v] of Object.entries(headers)) lower[k.toLowerCase()] = v
  return {
    headers: lower,
    body,
    get: (name) => lower[String(name).toLowerCase()],
    ...rest,
  }
}

module.exports = { mockRes, mockReq }
