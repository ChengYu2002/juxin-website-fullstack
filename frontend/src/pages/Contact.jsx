// src/pages/Contact.jsx
import { useEffect, useMemo, useState, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useField } from '../hooks/useField'
import { submitInquiry } from '../services/inquiryService'
import Seo from '../components/Seo'

const COMPANY_EMAIL = 'sale01@cn-jason.net'
const SUBJECT_PREFIX = 'Inquiry from Juxin Website'

function isValidEmail(v) {
  // email 校验（v1）
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())
}

//string.trim(): 去除字符串「开头和结尾」的空白字符

export default function Contact() {

  const name = useField('text')
  const email = useField('email')
  const message = useField('text')

  const [status, setStatus] = useState('idle') // idle | submitting | success | error
  const [error, setError] = useState('')

  // useRef 的 .current 改变，不会触发组件重新渲染；
  const prefillAppliedRef = useRef(false)

  // 蜜罐字段引用：正常用户永远为空，机器人常会填
  const companyRef = useRef(null)

  // 记录是否提交过
  const [showValidation, setShowValidation] = useState(false)

  // ✅ 保存最近一次提交内容：用于 reset 后仍能生成 mailto 草稿
  const [lastSubmitted, setLastSubmitted] = useState(null)

  // 处理网址params 预填 message
  const [searchParams] = useSearchParams()
  const productId = searchParams.get('productId') ?? ''
  const productName = searchParams.get('productName') ?? ''
  const variant = searchParams.get('variant') ?? ''

  // 初始化: 打开页面永远滚动到顶部
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [])

  // 初始化：把产品信息写进 message（只在参数变化时触发）
  useEffect(() => {
    if (!productId && !productName) return

    // ✅ 已经预填过，就永远不再动 message
    if (prefillAppliedRef.current) return

    // ✅ 防止覆盖用户已输入内容：只有 message 为空时才自动填模板
    if (message.input.value?.trim()) return

    const template = `Hi Juxin Team,

      I'm interested in:
      - Product: ${productName}${productId ? ` (${productId})` : ''}
      - Variant: ${variant || 'N/A'}

      Please share your quotation (price, lead time, packing, customization and shipping terms).

      Thanks.`

    message.input.onChange({
      target: { value: template },
    })

    // ✅ 标记：已经做过一次预填
    prefillAppliedRef.current = true

    // ESlint 忽略 message.input warning
  }, [productId, productName, variant])

  const values = {
    name: name.input.value ?? '',
    email: email.input.value ?? '',
    message: message.input.value ?? '',
  }

  const actualValidation = useMemo(() => {
    const errs = {}
    if (!values.name.trim()) errs.name = 'Please enter your name.'
    if (!values.email.trim()) errs.email = 'Please enter your email.'
    else if (!isValidEmail(values.email)) errs.email = 'Please enter a valid email.'
    if (!values.message.trim()) errs.message = 'Please enter your message.'
    return errs
  }, [values.name, values.email, values.message])
  // useMemo: 记忆化计算，避免每次渲染都重新计算 eg.name, email, message 只在变化时才重新计算

  // 是否显示验证错误
  const visibleValidation = showValidation ? actualValidation : {}

  // 表单是否真的有效（基于实际验证，不是显示验证）
  const isFormActuallyValid = Object.keys(actualValidation).length === 0

  // ✅ UX：成功提示 4 秒后自动消失（回到 idle）
  useEffect(() => {
    if (status === 'success') {
      const t = setTimeout(() => setStatus('idle'), 4000)
      return () => clearTimeout(t) // 前端组件卸载时防止副作用
    }
  }, [status])

  // ✅ UX：用户开始改输入时，把顶部 error 清掉（避免一直红）
  useEffect(() => {
    if (status === 'error') {
      setError('')
      setStatus('idle')
    }
    // 只要用户改了任一字段，就触发一次
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values.name, values.email, values.message])

  // ✅ mailto 用“当前输入”优先；如果已成功提交且 reset 了，用 lastSubmitted 兜底
  const _mailtoPayload = lastSubmitted ?? values
  // ??: nullish coalescing operator，取前者非 null/undefined 的值，否则取后者

  // 生成 mailto 链接:
  // mailto: 是“打开邮箱并预填内容”的 URL 协议，不是“自动发送邮件”。
  // 它可以带 subject、body 等参数。
  const mailtoHref = useMemo(() => {
    const subject = `${SUBJECT_PREFIX} - ${values.name || 'Anonymous'}`
    const body = [
      `Name: ${values.name}`,
      `Email: ${values.email}`,
      '',
      'Message:',
      values.message,
      '',
      '— Sent from Juxin website contact form',
    ].join('\n')

    return `mailto:${encodeURIComponent(COMPANY_EMAIL)}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`
    // encodeURIComponent: 对字符串进行 URL 编码，确保特殊字符不会破坏 URL 结构
  }, [values.name, values.email, values.message])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setShowValidation(true) // 显示验证错误

    if (!isFormActuallyValid) {
      setStatus('error')
      setError('Please fix the highlighted fields and try again.')
      return
    }
    setStatus('submitting')

    // 取当前值（避免 reset 后 values 变化）
    // ✅ 带上蜜罐字段 company（后端据此拦截机器人）
    const payload = { ...values, company: companyRef.current?.value ?? '' }

    try {
      // v1.5：fetch/axios 提交到后端 API
      const _response = await submitInquiry(payload)

      // ✅ 关键：reset 前保存一次（否则 reset 后 values 为空）
      setLastSubmitted(payload)

      // alert("Form submitted (simulated). Check console for details.");
      // console.log("Submitted inquiry:", values);

      setStatus('success')
      name.reset()
      email.reset()
      message.reset()
      setShowValidation(false) // 成功提交后隐藏验证错误
    } catch (err) {
      setStatus('error')
      // 给一个更“可用”的错误提示
      let msg = 'Something went wrong. Please try again or email us directly.'

      if (err?.status === 429) {
        msg = 'We\'ve already received your message. Please avoid submitting again and allow us some time to respond.'
      } else if (err?.message?.includes('Failed to fetch')) {
        msg = 'Cannot reach our server right now. Please try again later or email us directly.'
      }

      setError(msg)
    }
  }

  return (
    <main className="mx-auto max-w-xl p-6">
      <Seo
        title="Contact Us"
        description="Contact Juxin Manufacturing for wholesale and OEM/ODM inquiries — shopping trolleys, utility carts, camping wagons and outdoor furniture. Get a quote on MOQ, packing and shipping."
        path="/contact"
      />
      <h1 className="mb-2 text-2xl font-semibold">Contact Us</h1>
      <p className="mb-6 text-sm text-gray-600">Send us an inquiry.</p>

      {/* 状态条 */}
      {status === 'success' && (
        <div className="mb-4 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          Submitted! If you want to send it as an email, click “Open Email Draft” below.
        </div>
      )}
      {status === 'error' && error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 蜜罐字段：company, 人看不到，机器人常会填 */}
        <input
          ref={companyRef}
          name="company"
          className="hidden"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
        />

        {/* input: name */}
        <div>
          <label className="block text-sm font-medium">Name</label>
          <input
            {...name.input}
            className={`w-full rounded-md border px-3 py-2 ${
              visibleValidation.name ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Your name"
          />
          {visibleValidation.name && (
            <p className="mt-1 text-xs text-red-600">{visibleValidation.name}</p>
          )}
        </div>

        {/* input: email */}
        <div>
          <label className="block text-sm font-medium">Email</label>
          <input
            {...email.input}
            className={`w-full rounded-md border px-3 py-2 ${
              visibleValidation.email ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="you@example.com"
          />
          {visibleValidation.email && (
            <p className="mt-1 text-xs text-red-600">{visibleValidation.email}</p>
          )}
        </div>

        {/* input: message */}
        <div>
          <label className="block text-sm font-medium">Message</label>
          <textarea
            {...message.input}
            rows={10}
            className={`w-full rounded-md border px-3 py-2 ${
              visibleValidation.message ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Tell us what product you need, quantity, customization, destination port, etc."
          />
          {visibleValidation.message && (
            <p className="mt-1 text-xs text-red-600">{visibleValidation.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <button
            type="submit"
            disabled={status === 'submitting'}
            // 当 status === "submitting" 时，把按钮“禁用掉”，用户点不了了。
            className="rounded-md bg-gray-800 px-6 py-2 text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {status === 'submitting' ? 'Submitting...' : 'Submit'}
          </button>

          {/* ✅ 提交中禁用 mailto，避免用户乱点 */}
          <a
            href={status === 'submitting' ? undefined : mailtoHref}
            onClick={(e) => {
              if (status === 'submitting') e.preventDefault()
            }}
            className={`rounded-md border px-6 py-2 text-center transition ${
              status === 'submitting'
                ? 'cursor-not-allowed border-gray-200 text-gray-400'
                : 'border-gray-300 text-gray-800 hover:bg-gray-50'
            }`}
          >
            Open Email Draft
          </a>
          {/* 这里用一个 <a> 标签，点击后会打开用户的邮箱客户端，并预填邮件内容   */}
        </div>

        <p className="pt-2 text-xs text-gray-500">
          Or email us directly:{' '}
          <a className="underline" href={`mailto:${COMPANY_EMAIL}`}>
            {COMPANY_EMAIL}
          </a>
        </p>
      </form>
    </main>
  )
}
