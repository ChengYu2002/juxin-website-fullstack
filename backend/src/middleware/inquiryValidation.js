// src/middleware/inquiryValidation.js
// 作用：
// 1) 校验 inquiry 输入（必填、格式、长度）
// 2) Honeypot（拦简单机器人）
// 3) 防重复提交（5分钟内同 IP + email + message）
//
// 为什么先合在一个文件？
// - v1.5 阶段逻辑强相关
// - 减少文件跳转，便于理解整条请求链路
// - 以后如果变复杂，可以很容易拆回多个 middleware

/**
 * ========== 工具函数 ==========
 */

// 最小 email 校验（够用）
function isValidEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v).trim())
}

/**
   * ========== 防重复提交（内存版） ==========
   * key: `${ip}||${email}||${message}`
   * value: timestamp
   */
const recent = new Map()
const DUPLICATE_INTERVAL = 5 * 60 * 1000 // 5 分钟

function cleanupOld(now) {
  for (const [key, timestamp] of recent.entries()) {
    if (now - timestamp > DUPLICATE_INTERVAL) {
      recent.delete(key)
    }
  }
}

/**
   * ========== middleware：validate + honeypot ==========
   */
function validateInquiry(req, res, next) {
  const payload = req.body || {}

  /**
     * Honeypot（蜜罐）
     * - 前端放一个隐藏<input> name="company"
     * - 人不会填，机器人经常会填
     */
  const honeypot = String(payload.company || '').trim()
  if (honeypot) {
    return res.status(400).json({ ok: false, error: 'bad request' })
  }

  // 基础字段清洗
  const name = String(payload.name || '').trim()
  const email = String(payload.email || '').trim()
  const message = String(payload.message || '').trim()

  // 必填校验
  if (!name || !email || !message) {
    return res.status(400).json({ ok: false, error: 'missing fields' })
  }

  // email 格式
  if (!isValidEmail(email)) {
    return res.status(400).json({ ok: false, error: 'invalid email' })
  }

  // 长度限制（防 abuse）
  if (name.length > 120) {
    return res.status(400).json({ ok: false, error: 'name too long' })
  }
  if (email.length > 200) {
    return res.status(400).json({ ok: false, error: 'email too long' })
  }
  if (message.length > 5000) {
    return res.status(400).json({ ok: false, error: 'message too long' })
  }

  // 把“干净数据”挂到 req 上，给后面的 middleware / controller 用
  req.inquiryValidated = { name, email, message }

  next()
}

/**
   * ========== middleware：防重复提交（防抖） ==========
   */
function dedupeInquiry(req, res, next) {
  const { ip } = req.clientMeta            // 来自 getClientMeta middleware
  const { name, email, message } = req.inquiryValidated

  const now = Date.now()
  cleanupOld(now)

  const key = `${ip}||${name}||${email}||${message}`

  // 5 分钟内相同内容，直接拒绝
  if (recent.has(key)) {
    return res.status(429).json({
      ok: false,
      error: 'duplicate submission',
    })
  }

  recent.set(key, now)
  next()
}

module.exports = {
  validateInquiry,
  dedupeInquiry,
}
