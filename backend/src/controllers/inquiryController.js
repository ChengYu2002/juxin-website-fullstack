// src/controllers/inquiryController.js
// 作用：处理 inquiry 的业务逻辑：发邮件、返回结果、数据操作、CRUD。
//
// ✅ 关键设计（更接近真实生产）
// 1) 用户提交 = “落库成功” 就算成功（快速返回，体验好）
// 2) 发邮件 / geo 查询属于“副作用 side-effects”，放到后台异步做
// 3) 邮件失败 ≠ 提交失败：不会让客户看到“提交失败”
// 4) emailed 用三态：null | true | false
//    - null：尚未尝试 / 正在后台处理
//    - true：邮件发送成功
//    - false：邮件发送失败

const Inquiry = require('../models/inquiry')
const { createInquiry: createInquiryRecord } = require('../services/inquiryService')


// 创建新的 inquiry
// POST /api/inquiries
// 核心逻辑（落库 + 后台 geo/邮件/回写）已抽到 services/inquiryService，controller 与 agent 工具共用。
async function createInquiry(req, res, next) {
  try {
    const { name, email, message } = req.body
    const { ip } = req.clientMeta

    // 落库（await 主链路），副作用由 service 丢后台；这里拿到 id 立刻响应，不等 geo + SMTP。
    // emailSent:'pending' —— 内部运维信息不向客户暴露"邮件是否成功"。
    const inquiry = await createInquiryRecord({ name, email, message, ip })

    res.status(201).json({
      ok: true,
      id: inquiry.id,
      emailSent: 'pending',
    })
  } catch (err) {
    return next(err)
  }
}

// 获取所有 inquiry 列表（管理员用）
// GET /api/inquiries/admin
async function getAllInquiries(req, res, next) {
  try {
    // 按创建时间倒序返回
    const inquiries = await Inquiry
      .find({})
      .sort({ createdAt: -1 })

    return res.json(inquiries)
  } catch (err) {
    return next(err)
  }
}

// 删除某个 inquiry（管理员用）
// DELETE /api/inquiries/admin/:id
async function deleteInquiry(req, res, next) {
  try {
    const inquiryId = req.params.id
    const inquiry = await Inquiry.findByIdAndDelete(inquiryId)

    if (!inquiry) {
      return res.status(404).json({ error: 'inquiry not found' })
    }
    return res.status(204).end()
  } catch (err) {
    return next(err)
  }
}

// 修改某个 inquiry（管理员用）
// 当前只支持修改 status 字段
// PUT /api/inquiries/admin/:id
async function updateInquiry(req, res, next) {
  try {
    const inquiryId = req.params.id
    const { status } = req.body

    if (!['new', 'done'].includes(status)) {
      return res.status(400).json({ ok: false, error: 'invalid status' })
    }

    const updated = await Inquiry.findByIdAndUpdate(
      inquiryId,
      { status },
      { new: true, runValidators: true }
    )

    if (!updated) {
      return res.status(404).json({ ok: false, error: 'inquiry not found' })
    }

    res.json(updated)
  } catch (err) {
    return next(err)
  }
}

module.exports = { createInquiry, getAllInquiries, deleteInquiry, updateInquiry }