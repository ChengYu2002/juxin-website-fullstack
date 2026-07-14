/**
 * src/services/mailer.js
 *
 * 作用：
 * 统一封装「发送询盘通知邮件」的能力，对 controller 层只暴露一个 sendInquiryMail 方法。
 *
 * 设计说明：
 * - SMTP（nodemailer）：适合本地 / 国内云 / 企业邮箱环境
 * - Resend（HTTP API）：适合 Render / Vercel / Serverless 等云环境（更稳定）
 *
 * 使用策略：
 * - 默认优先使用 Resend（如果配置了 RESEND_API_KEY）
 * - 否则 fallback 到 SMTP
 *
 * ⚠️ 注意：
 * - 邮件属于“通知层”，失败不应影响询盘主流程
 */
const nodemailer = require('nodemailer')

let resendClient = null
if (process.env.RESEND_API_KEY) {
  // 懒加载，避免没装 resend 包时报错
  const { Resend } = require('resend')
  resendClient = new Resend(process.env.RESEND_API_KEY)
}

/* -------------------------------------------------------------------------- */
/*                              SMTP 实现                                      */
/* -------------------------------------------------------------------------- */

// transporter = “邮局通道”
// 这里用公司邮箱的 SMTP 来发信（系统通知邮件）
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,                  // 公司邮箱提供的 SMTP 域名
  port: Number(process.env.SMTP_PORT),          // 常见 465 或 587
  secure: process.env.SMTP_SECURE === 'true',   // 465 => true, 587 => false
  auth: {
    user: process.env.SMTP_USER,                // 发件账号（一般就是公司邮箱）
    pass: process.env.SMTP_PASS,                // SMTP 授权码
  },
  connectionTimeout: 20_000,
  greetingTimeout: 20_000,
  socketTimeout: 20_000,
})

async function sendViaSMTP(payload) {
  // 邮件主题：方便你在收件箱里一眼看到是谁来的询盘
  const subject = `[New Inquiry] ${payload?.name || 'Anonymous'} | Juxin Website`
  // 邮件正文
  const body = buildMailBody(payload)

  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to: process.env.MAIL_TO,
    subject,
    text: body,
    replyTo: payload?.email ? String(payload.email).trim() : undefined,
  })
}

/* -------------------------------------------------------------------------- */
/*                             Resend 实现                                     */
/* -------------------------------------------------------------------------- */
async function sendViaResend(payload) {
  if (!resendClient) {
    throw new Error('Resend client is not initialized')
  }

  const subject = `[New Inquiry] ${payload?.name || 'Anonymous'} | Juxin Website`
  const body = buildMailBody(payload)

  await resendClient.emails.send({
    from: process.env.MAIL_FROM || 'onboarding@resend.dev',
    to: process.env.MAIL_TO,
    subject,
    text: body,
    reply_to: payload?.email ? String(payload.email).trim() : undefined,
  })

}

/* -------------------------------------------------------------------------- */
/*                         统一对外接口                                       */
/* -------------------------------------------------------------------------- */
async function sendInquiryMail(payload) {
  console.log(
    process.env.RESEND_API_KEY
      ? 'Mailer using Resend'
      : 'Mailer using SMTP'
  )


  // 优先走 Resend（云环境稳定）
  if (resendClient) {
    return sendViaResend(payload)
  }

  // fallback：SMTP
  return sendViaSMTP(payload)
}


/* -------------------------------------------------------------------------- */
/*                                 工具函数                                    */
/* -------------------------------------------------------------------------- */

function buildMailBody(payload) {
  return [
    'You have received a new inquiry from the Juxin website.',
    '',
    '==============================',
    'Buyer Information',
    '==============================',
    `Name   : ${payload?.name || '-'}`,
    `Email  : ${payload?.email || '-'}`,
    `Country: ${payload?.country || '-'}`,
    `Region : ${payload?.region || '-'}`,
    '',
    '==============================',
    'Inquiry Message',
    '==============================',
    payload?.message || '-',
    '',
    '==============================',
    `Submitted at (Beijing Time 北京时间): ${new Date().toLocaleString('zh-CN', {
      timeZone: 'Asia/Shanghai',
      hour12: false,
    })}`,
    '',
    'This is an automated notification from the Juxin website.',
    'Please reply directly to this email to contact the buyer.',
  ].join('\n')
}


module.exports = {
  sendInquiryMail,

  // 以下导出主要用于调试 / 将来扩展
  sendViaSMTP,
  sendViaResend,
}


