// src/middleware/adminToken.js
// 管理员 Token 验证中间件

const adminToken = (req, res, next) => {
  const authHeader = req.get('authorization') || ''

  if (authHeader && authHeader.toLowerCase().trim().startsWith('bearer ')) {
    // 挂在 token 到 req 对象上，供后续中间件或路由使用
    req.token = authHeader.substring(7)
  } else {
    return res.status(401).json({ ok: false, error: 'unauthorized: missing token' })
  }

  // 验证 Token 是否与预设的管理员 Token 匹配
  if (req.token === process.env.ADMIN_TOKEN) {
    next() // Token 验证通过，继续处理请求
  } else {
    return res.status(403).json({ ok: false, error: 'forbidden: invalid admin token' })
  }
}

module.exports = { adminToken }