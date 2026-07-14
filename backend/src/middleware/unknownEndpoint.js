// src/middleware/unknownEndpoint.js
// 作用：所有路由都没匹配到时，统一返回 404（必须放在路由挂载之后）

const unknownEndpoint = (_req, res) => {
  res.status(404).json({ ok: false, error: 'unknown endpoint' })
}

module.exports = { unknownEndpoint }
