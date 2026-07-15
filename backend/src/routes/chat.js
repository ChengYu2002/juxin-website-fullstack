// src/routes/chat.js
// 作用：/api/chat 路由（P1 纯对话）

const router = require('express').Router()
const { rateLimit, ipKeyGenerator } = require('express-rate-limit')
const { postChat } = require('../controllers/chatController')

// LLM 端点公开且烧钱/有配额，必须防刷。
// P1 用内存存储够单实例；多实例部署时可换成 inquiry 那样的 MongoStore。
const chatLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 分钟
  limit: 20,           // 每 IP 每分钟 20 次（对话比 inquiry 频繁，放宽些）
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const xff = req.headers['x-forwarded-for']
    const ip = typeof xff === 'string' && xff.length > 0 ? xff.split(',')[0].trim() : req.ip
    return ipKeyGenerator(ip)
  },
  message: { error: '请求过于频繁，请稍后再试' },
})

router.post('/', chatLimiter, postChat)

module.exports = router
