// src/routes/inquiry.js
// 作用：inquiry 相关路由

const router = require('express').Router()
const { inquirySpeedLimiter, inquiryLimiter }  = require('../middleware/inquiryProtection')
const { createInquiry, getAllInquiries, deleteInquiry, updateInquiry } = require('../controllers/inquiryController')
const { validateInquiry, dedupeInquiry } = require('../middleware/inquiryValidation')
const { getClientMeta } = require('../utils/clientMeta')
const { requireAdmin } = require('../middleware/requireAdmin')


// 中间件：附加客户端元信息到请求对象
const attachClientMeta = (req, _res, next) => {
  req.clientMeta = getClientMeta(req)
  next()
}

// 创建新的 inquiry
// 公开路由，无需管理员 Token
router.post('/',
  inquirySpeedLimiter,
  inquiryLimiter,
  attachClientMeta,
  validateInquiry,  // 校验请求数据
  dedupeInquiry,    // 防重复提交
  createInquiry     // 真正业务逻辑
)

// 以下路由均需管理员 Token 验证

// 获取所有 inquiry
router.get('/admin/', requireAdmin, getAllInquiries)

// 删除指定 ID 的 inquiry
router.delete('/admin/:id', requireAdmin, deleteInquiry)

// 修改指定 ID 的 inquiry
router.put('/admin/:id', requireAdmin, updateInquiry)

module.exports = router