// src/middleware/inquiryProtection.js

// 路由级防刷：slowDown + rateLimit（只对 /api/inquiry 生效）
const { rateLimit, ipKeyGenerator } = require('express-rate-limit')
const slowDown = require('express-slow-down')
const MongoStore = require('rate-limit-mongo')

/**
 * ✅ slowDown（减速）
 * - 解决：刷子一秒几十次打你接口
 * - 做法：超过阈值开始“逐渐变慢”，让刷子成本升高
 */
const inquirySpeedLimiter = slowDown({
  windowMs: 10 * 60 * 1000, // 10 minutes
  delayAfter: 3,            // allow 3 requests per 10 minutes, then...
  delayMs: () => 800,       // begin adding 800ms of delay per request above 3:
})

/**
 * ✅ rateLimit（限流）
 * - 解决：刷子一秒几十次打你接口
 * - 做法：达到上限直接 429
*/
const inquiryLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  limit: 5,                 // limit each IP to this time requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,

  // 使用 MongoDB 作为限流数据存储
  store: new MongoStore({
    uri: process.env.MONGODB_URI,
    collectionName: 'rateLimits',
    expireTimeMs: 10 * 60 * 1000,
  }),

  // 自定义 key 生成器，优先使用 x-forwarded-for 头部
  // ⚠️ 必须用 ipKeyGenerator 归一化 IP：否则 IPv6 用户可绕过限流
  keyGenerator: (req) => {
    const xff = req.headers['x-forwarded-for']
    const ip =
      typeof xff === 'string' && xff.length > 0
        ? xff.split(',')[0].trim()
        : req.ip
    return ipKeyGenerator(ip)
  },

  message: {
    ok: false,
    error: 'Too many inquiries created from this IP, please try again later.',
  },
})

module.exports = { inquirySpeedLimiter, inquiryLimiter }
