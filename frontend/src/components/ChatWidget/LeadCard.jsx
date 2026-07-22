// src/components/ChatWidget/LeadCard.jsx
// 留资确认卡：Jason 生成草稿后，把 Name / Email / Message 亮给买家核对再发。
// - 发送 = 买家亲手点 ✓（人确认这一步兜住"模型误发/编邮箱/重复发"）
// - 三个字段都可直接编辑（所见即所得）；对话纠错仍并存
// - 排版对齐站点 Contact 表单：label 在上、Name→Email→Message、内容(textarea)放最下
// - Name 留空 → 提交 'Website Visitor'（占位在交互层，不动后端）
// - 满宽：由 ChatWidget 脱离 85% 气泡渲染，卡片占满对话框，手机上更好点
// - 移动端：输入用 text-base(16px) 防 iOS 聚焦自动缩放；聚焦时 scrollIntoView 把字段顶到
//   键盘上方（配合 ChatWidget 的 visualViewport 面板收缩）；✓/✗ 与输入框在手机上加大触控区

import { useState } from 'react'
import { Check, X, Loader2 } from 'lucide-react'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PLACEHOLDER_NAME = 'Website Visitor'

export default function LeadCard({ lead, onSubmit, onCancel }) {
  const [name, setName] = useState((lead.name || '').trim())
  const [email, setEmail] = useState((lead.email || '').trim())
  const [message, setMessage] = useState((lead.summary || '').trim())
  const [status, setStatus] = useState('idle') // idle | submitting | success | error
  const [errMsg, setErrMsg] = useState('')

  const emailValid = EMAIL_RE.test(email.trim())
  const messageValid = message.trim().length > 0
  const submitting = status === 'submitting'
  const canSubmit = emailValid && messageValid && !submitting

  // 移动端：键盘弹出（面板经 visualViewport 收缩）后，把聚焦字段滚到可视区中部，避免被键盘挡住
  function keepInView(e) {
    const el = e.currentTarget
    setTimeout(() => el?.scrollIntoView?.({ block: 'center', behavior: 'smooth' }), 300)
  }

  async function handleConfirm() {
    if (!canSubmit) return
    setStatus('submitting')
    setErrMsg('')
    try {
      await onSubmit({
        name: name.trim() || PLACEHOLDER_NAME,
        email: email.trim(),
        message: message.trim(),
      })
      setStatus('success')
    } catch (e) {
      setStatus('error')
      setErrMsg(e?.message || 'Failed to send, please retry.')
    }
  }

  if (status === 'success') {
    return (
      <div className="flex w-full items-center gap-2 rounded-2xl border border-emerald-400/30 bg-emerald-500/15 px-3 py-3 text-sm text-emerald-100">
        <Check size={16} className="shrink-0" />
        <span>Sent — our team will contact you shortly.</span>
      </div>
    )
  }

  // 输入通用样式：text-base(16px) 防 iOS 聚焦缩放，桌面收回 text-sm
  const fieldCls = (invalid) =>
    `w-full rounded-lg border bg-white/10 px-3 py-2.5 text-base text-white placeholder-white/30 outline-none transition focus:border-white/40 disabled:opacity-50 sm:py-2 sm:text-sm ${
      invalid ? 'border-amber-400/60' : 'border-white/15'
    }`

  return (
    <div className="w-full space-y-2.5 rounded-2xl border border-white/15 bg-white/[0.07] p-3 text-white/90">
      {/* Name（选填，留空→Website Visitor） */}
      <div>
        <label className="mb-1 block text-xs font-medium text-white/60">Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onFocus={keepInView}
          disabled={submitting}
          placeholder={PLACEHOLDER_NAME}
          className={fieldCls(false)}
        />
      </div>

      {/* Email（必填，可编） */}
      <div>
        <label className="mb-1 block text-xs font-medium text-white/60">Email</label>
        <input
          type="email"
          inputMode="email"
          autoCapitalize="off"
          autoCorrect="off"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onFocus={keepInView}
          disabled={submitting}
          placeholder="you@example.com"
          className={fieldCls(email.length > 0 && !emailValid)}
        />
        {email.length > 0 && !emailValid && (
          <p className="mt-1 text-xs text-amber-200/90">Please enter a valid email.</p>
        )}
      </div>

      {/* Message（内容，放最下；预填需求摘要，可编） */}
      <div>
        <label className="mb-1 block text-xs font-medium text-white/60">Message</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onFocus={keepInView}
          disabled={submitting}
          rows={3}
          placeholder="Product, quantity, destination, customization, etc."
          className={`${fieldCls(false)} resize-none`}
        />
      </div>

      {status === 'error' && <p className="text-xs text-red-200">{errMsg}</p>}

      {/* 动作：✗ 取消 / ✓ 确认发送（图标语言通用；手机加大触控区） */}
      <div className="flex items-center justify-end gap-2.5 pt-0.5">
        <button
          onClick={onCancel}
          disabled={submitting}
          aria-label="Cancel"
          title="Cancel"
          className="grid h-11 w-11 place-items-center rounded-xl border border-white/15 text-white/60 transition hover:bg-white/10 hover:text-white disabled:opacity-40 sm:h-9 sm:w-9"
        >
          <X size={19} />
        </button>
        <button
          onClick={handleConfirm}
          disabled={!canSubmit}
          aria-label="Confirm and send"
          title="Confirm & send"
          className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-500 text-white transition hover:bg-emerald-400 disabled:bg-white/15 disabled:text-white/40 sm:h-9 sm:w-9"
        >
          {submitting ? <Loader2 size={19} className="animate-spin" /> : <Check size={19} />}
        </button>
      </div>
    </div>
  )
}
