// src/middleware/errorHandler.js
// 作用：集中处理错误，返回合适的 HTTP 状态码和错误信息
const logger = require('../utils/logger')

const errorHandler = (error, req, res, _next) => {
  logger.error(error.message)
  // ⭐⭐ 业务自定义错误优先
  if (error.status) {
    return res.status(error.status).json({
      ok: false,
      error: error.message,
    })
  }

  // MongoDB: 无效的 ObjectId 错误
  if (error.name === 'CastError') {
    return res.status(400).json({
      ok: false,
      error: 'malformatted id',
    })
  }

  // MongoDB: unique index 冲突（例如 dedupeKey 重复）
  if (error.code === 11000) {
    return res.status(409).json({
      ok: false,
      error: 'duplicate inquiry (please wait a moment and try again)',
    })
  }

  // 校验错误（业务/表单）
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      ok: false,
      error: error.message,
    })
  }

  // 未知错误兜底
  return res.status(500).json({
    ok: false,
    error: 'internal server error',
  })
}

module.exports = { errorHandler }
