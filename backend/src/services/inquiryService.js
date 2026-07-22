// src/services/inquiryService.js
// 询盘核心业务逻辑：落库（主链路）+ 后台副作用（geo 查询 / 发邮件 / 回写状态）。
// 从 inquiryController 抽出，让 HTTP controller 和 agent 工具（P4）共用同一套逻辑 —— 单一数据源，工具不绕 HTTP。
//
// 设计（沿用原 controller 的生产级取舍）：
//   1) 落库成功即算成功，快速返回给调用方（体验好）
//   2) geo + 邮件属副作用，放后台异步做，不阻塞调用方响应
//   3) 邮件失败 ≠ 提交失败；emailed 三态 pending|sent|failed

const { sendInquiryMail } = require('./mailer')
const { getGeoByIp } = require('./geo')
const logger = require('../utils/logger')
const Inquiry = require('../models/inquiry')

// 后台副作用：geo 查询 → 发邮件 → 把 country/region/emailed 回写到这条询盘。
// 三步各自 try/catch，任一失败都不影响"询盘已落库"这一主结果。
async function runInquirySideEffects(inquiry) {
  const { _id, name, email, message, ip } = inquiry

  // (A) geo 可选：失败不影响整体流程
  let country = null
  let region = null
  try {
    if (ip) {
      const geo = await getGeoByIp(ip)
      country = geo?.country ?? null
      region = geo?.region ?? null
    }
  } catch {
    // ignore geo errors
  }

  // (B) 邮件可选：失败也不影响"落库成功"
  let emailStatus = 'sent'
  try {
    await sendInquiryMail({ name, email, message, country, region })
  } catch (err) {
    logger.error('❌ Failed to send inquiry email:', err?.message || err)
    emailStatus = 'failed'
  }

  // (C) 回写状态：内部数据库更新，非 API
  try {
    await Inquiry.findByIdAndUpdate(_id, { $set: { country, region, emailed: emailStatus } })
  } catch (err) {
    logger.error('❌ Failed to update inquiry status:', err?.message || err)
  }
}

/**
 * 创建一条询盘：先 await 落库（主链路），再把 geo/邮件/回写丢到后台。
 * 返回落库后的文档，调用方可立即拿 id 响应，副作用在后台跑完。
 * @param {{name:string, email:string, message:string, ip?:string|null}} input
 * @returns {Promise<import('mongoose').Document>} 落库后的 inquiry 文档
 */
async function createInquiry({ name, email, message, ip = null }) {
  // Step 1: 先落库（主链路）——成功即算成功
  const inquiry = await Inquiry.create({
    name,
    email,
    message,
    ip,
    country: null, // 稍后由副作用补充
    region: null,
  })

  // Step 2: 副作用放后台，不阻塞调用方响应
  //  setImmediate：在当前请求响应发出后、于同轮事件循环尽快执行
  setImmediate(() => runInquirySideEffects(inquiry))

  return inquiry
}

module.exports = { createInquiry, runInquirySideEffects }
