// src/middleware/requestLogger.js
// 作用：开发期看请求进来是什么样（生产环境要克制）
function requestLogger(req, res, next) {
  const logData = {
    method: req.method,
    path: req.originalUrl,
    ip: req.ip,
    userAgent: req.headers['user-agent'] || 'unknown',
  }

  // 仅开发和测试环境打印 body（避免生产泄露隐私/被刷爆日志）
  if (process.env.NODE_ENV !== 'production') {
    logData.body = req.body
  }

  console.info('[request]', logData)
  next()
}

module.exports = { requestLogger }