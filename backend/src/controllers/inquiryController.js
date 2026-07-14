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

const { sendInquiryMail } = require('../services/mailer')
const { getGeoByIp } = require('../services/geo')
const logger = require('../utils/logger')
const Inquiry = require('../models/inquiry')


// 创建新的 inquiry
// POST /api/inquiries
async function createInquiry(req, res, next) {
  try {
    const { name, email, message } = req.body
    const { ip } = req.clientMeta

    // ------------------------------------------------------------------
    // ✅ Step 1：先落库（主链路）
    // - 这一步成功就返回给前端：用户体验最好
    // - emailed 先写 null，表示“后台稍后处理”
    // - country/region 也先占位 null
    // ------------------------------------------------------------------
    const inquiry = await Inquiry.create({ // .create 一步完成：new document, schema 校验, save
      name,
      email,
      message,
      ip,
      country: null,     // 国家：稍后补充
      region: null,      // 省份：稍后补充
    })

    // ------------------------------------------------------------------
    // ✅ Step 2：立刻响应（不要等待 geo + SMTP）
    // - 前端可以直接提示 “Submitted successfully”
    // - emailSent 返回 null，告诉前端：我们不会向客户暴露“邮件是否成功”的细节
    //   （一般不建议对客户展示：邮件成功/失败，因为那是内部运维信息）
    // ------------------------------------------------------------------
    res.status(201).json({
      ok: true,
      id: inquiry.id,
      emailSent: 'pending',
    })

    // ------------------------------------------------------------------
    // ✅ Step 3：后台异步执行副作用（geo + email + 回写状态）
    // - 不走 HTTP，不用新 API
    // - 不阻塞用户响应
    // - setImmediate：在请求处理结束、响应发出后，于同一轮事件循环中尽快执行，不阻塞用户响应
    // ------------------------------------------------------------------
    setImmediate(async () => {
      let country = null
      let region = null

      // (A) geo 可选：失败不影响整体流程
      try {
        if (ip) {
          const geo = await getGeoByIp(ip)
          country = geo?.country ?? null
          region = geo?.region ?? null
        }
      } catch {
        // ignore geo errors
      }

      // (B) 邮件可选：失败也不影响“提交成功”
      let emailStatus = 'sent'

      try {
        await sendInquiryMail({ name, email, message, country, region })
      } catch (err) {
        logger.error('❌ Failed to send inquiry email:', err?.message || err)
        emailStatus = 'failed'
      }

      // (C) 回写状态：把 geo / emailed 更新回这条 inquiry
      // - 这不是 API，是内部数据库更新
      try {
        await Inquiry.findByIdAndUpdate(inquiry._id, {
          $set: { country, region, emailed: emailStatus },
        })
      } catch(err) {
        logger.error('❌ Failed to update inquiry status:', err?.message || err)
      }

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