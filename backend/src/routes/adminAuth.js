// src/routes/adminAuth.js
// 作用：管理员认证相关路由

const router = require('express').Router()
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const { rateLimit } = require('express-rate-limit')

/**
 * ✅ 登录限流：防暴力破解
 * - 每 IP 15 分钟最多 10 次登录尝试，超过返回 429
 * - 默认 keyGenerator 已正确处理 IPv6，并配合 app 的 trust proxy 取真实 IP
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分钟
  limit: 10,                // 每 IP 每窗口最多 10 次
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    ok: false,
    message: 'Too many login attempts, please try again later.',
  },
})

/**
 * 校验密码：
 * - 优先用 bcrypt 比对 ADMIN_PASSWORD_HASH（安全）
 * - 若尚未配置哈希，则回退到明文 ADMIN_PASSWORD 并告警
 *   （过渡用：例如线上环境变量还没补 ADMIN_PASSWORD_HASH 时，避免被锁在门外）
 */
async function verifyPassword(password) {
  const hash = process.env.ADMIN_PASSWORD_HASH
  if (hash) {
    return bcrypt.compare(password, hash)
  }
  if (process.env.ADMIN_PASSWORD) {
    console.warn(
      '[login] ADMIN_PASSWORD_HASH 未配置，回退明文比对（不安全，请尽快配置哈希）'
    )
    return password === process.env.ADMIN_PASSWORD
  }
  return false
}

router.post('/login', loginLimiter, async (req, res, next) => {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      return res.status(400).json({ ok: false, message: 'account or password required' })
    }

    const usernameOk = username === process.env.ADMIN_USERNAME
    const passwordOk = await verifyPassword(password)

    if (!usernameOk || !passwordOk) {
      return res.status(401).json({ ok: false, message: 'invalid credentials' })
    }

    const payload = { username: process.env.ADMIN_USERNAME, role: 'admin' }

    const token = jwt.sign(payload, process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d', }
    )

    return res.json({ ok: true, token })
  } catch (err) {
    return next(err)
  }
})

module.exports = router
