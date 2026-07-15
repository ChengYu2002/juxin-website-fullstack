// src/components/ChatWidget/ChatWidget.jsx
// 售前 AI 助理浮动气泡（P1：纯对话）
// - 前端持有 messages[] 历史，每次整包发给 /api/chat（模型无状态，历史即记忆）
// - 匿名 conversationId 存 localStorage（P4 会用它把对话关联到询盘）
// - 视觉：深色毛玻璃 / 黑白透明 / 灵动悬浮，对齐站点审美（Tailwind）
// - 响应式：手机近全屏 sheet，桌面右下浮窗；输入框 16px 防 iOS 聚焦缩放

import { useEffect, useRef, useState } from 'react'
import { MessageCircle, X, Send } from 'lucide-react'
import { sendChat } from '../../services/chatService'

const CID_KEY = 'juxin_chat_cid'

// 取/建匿名会话 ID
function getConversationId() {
  let cid = localStorage.getItem(CID_KEY)
  if (!cid) {
    cid = crypto.randomUUID()
    localStorage.setItem(CID_KEY, cid)
  }
  return cid
}

const WELCOME = {
  role: 'assistant',
  content: '您好！我是巨鑫的售前助理 Jason，可以帮您了解购物手推车、露营拖车等产品。请问有什么可以帮您？',
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([WELCOME]) // 含欢迎语，仅展示
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [hint, setHint] = useState('hidden') // 'hidden' | 'shown' | 'dismissed' —— 引起注意的提醒

  const listRef = useRef(null)
  const cidRef = useRef(null)

  // 进站 2.5s 后冒出"我是 Jason"提醒（未开过 / 未关掉时）
  useEffect(() => {
    if (open || hint !== 'hidden') return
    const t = setTimeout(() => setHint('shown'), 2500)
    return () => clearTimeout(t)
  }, [open, hint])

  // 打开时才生成 conversationId（首次交互再落 localStorage）
  useEffect(() => {
    if (open && !cidRef.current) cidRef.current = getConversationId()
  }, [open])

  // 新消息/加载态变化时滚到底
  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight
  }, [messages, loading])

  async function handleSend() {
    const text = input.trim()
    if (!text || loading) return

    const nextMessages = [...messages, { role: 'user', content: text }]
    setMessages(nextMessages)
    setInput('')
    setError(null)
    setLoading(true)

    try {
      // 只发真正的对话轮次给后端（欢迎语是纯展示）
      const payload = nextMessages.filter((m) => m !== WELCOME)
      const { reply } = await sendChat(payload, cidRef.current)
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }])
    } catch (err) {
      setError(err.message || '发送失败')
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e) {
    // Enter 发送，Shift+Enter 换行
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // 未打开、未关掉提醒时，圆钮跳动 + 光环 + 气泡都激活
  const nudging = !open && hint !== 'dismissed'

  return (
    <>
      {/* 灵动悬浮 / 提醒动画 */}
      <style>{`
        @keyframes cwIn{from{opacity:0;transform:translateY(12px) scale(.98)}to{opacity:1;transform:none}}
        @keyframes cwPing{0%{transform:scale(1);opacity:.5}70%{opacity:0}100%{transform:scale(1.9);opacity:0}}
        @keyframes cwHintIn{from{opacity:0;transform:translateX(10px) scale(.96)}to{opacity:1;transform:none}}
        @keyframes cwBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
      `}</style>

      {/* 对话面板：手机近全屏 sheet，桌面右下浮窗 */}
      {open && (
        <div
          role="dialog"
          aria-label="巨鑫售前助理"
          style={{ animation: 'cwIn .22s ease-out' }}
          className="
            fixed z-[1001] flex flex-col overflow-hidden text-white
            inset-3 rounded-2xl
            sm:inset-auto sm:right-6 sm:bottom-24 sm:h-[560px] sm:w-[370px] sm:max-h-[calc(100dvh-8rem)]
            border border-white/15 bg-neutral-950/80 backdrop-blur-xl
            shadow-[0_16px_50px_rgba(0,0,0,0.5)] sm:bg-neutral-950/60
          "
        >
          {/* 玻璃高光反射 */}
          <div className="pointer-events-none absolute inset-0 rounded-2xl bg-[linear-gradient(120deg,rgba(255,255,255,0.14),rgba(255,255,255,0.02)_40%,transparent_60%)]" />

          <div className="relative z-10 flex h-full flex-col">
            {/* 头部 */}
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.7)]" />
                <span className="text-sm font-semibold">巨鑫售前助理 · Jason</span>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="关闭"
                className="-mr-1 grid h-8 w-8 place-items-center rounded-full text-white/60 transition hover:bg-white/10 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            {/* 消息区 */}
            <div
              ref={listRef}
              className="flex flex-1 flex-col gap-2.5 overflow-y-auto px-4 py-4 [scrollbar-color:rgba(255,255,255,0.25)_transparent] [scrollbar-width:thin]"
            >
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={
                    m.role === 'user'
                      ? 'max-w-[85%] self-end whitespace-pre-wrap break-words rounded-2xl rounded-br-md bg-white px-3 py-2 text-sm leading-relaxed text-neutral-900 shadow-sm'
                      : 'max-w-[85%] self-start whitespace-pre-wrap break-words rounded-2xl rounded-bl-md border border-white/10 bg-white/10 px-3 py-2 text-sm leading-relaxed text-white/90'
                  }
                >
                  {m.content}
                </div>
              ))}
              {loading && (
                <div className="max-w-[85%] self-start rounded-2xl rounded-bl-md border border-white/10 bg-white/5 px-3 py-2 text-sm italic text-white/50">
                  Jason 正在输入…
                </div>
              )}
              {error && (
                <div className="self-center rounded-lg border border-red-400/20 bg-red-500/15 px-2.5 py-1.5 text-xs text-red-200">
                  {error}
                </div>
              )}
            </div>

            {/* 输入区 —— text-base(16px) 防 iOS 聚焦缩放；底部留安全区 */}
            <div className="flex items-end gap-2 border-t border-white/10 px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              <textarea
                rows={1}
                placeholder="输入问题，Enter 发送…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
                className="
                  max-h-24 flex-1 resize-none rounded-xl border border-white/15 bg-white/10
                  px-3 py-2 text-base text-white placeholder-white/40 outline-none
                  backdrop-blur transition focus:border-white/40 sm:text-sm
                "
              />
              <button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                aria-label="发送"
                className="
                  grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-neutral-900
                  transition hover:bg-white/90 disabled:bg-white/20 disabled:text-white/40
                "
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 底部：提醒气泡 + 悬浮圆钮（手机打开时隐藏，用面板头部 × 关闭） */}
      <div
        className={`fixed bottom-5 right-5 z-[1000] items-center gap-2.5 sm:bottom-6 sm:right-6 ${
          open ? 'hidden sm:flex' : 'flex'
        }`}
      >
        {/* 提醒气泡：点文字开聊，点 × 关掉 */}
        {nudging && hint === 'shown' && (
          <div
            style={{ animation: 'cwHintIn .3s ease-out' }}
            className="
              flex max-w-[70vw] items-center gap-1 whitespace-nowrap rounded-full
              border border-white/15 bg-neutral-900/75 py-2 pl-4 pr-2 text-sm text-white
              shadow-[0_8px_30px_rgba(0,0,0,0.3)] backdrop-blur-md
            "
          >
            <button
              onClick={() => {
                setOpen(true)
                setHint('dismissed')
              }}
              className="cursor-pointer truncate"
            >
              👋 你好，我是 Jason
            </button>
            <button
              onClick={() => setHint('dismissed')}
              aria-label="关闭提示"
              className="grid h-5 w-5 shrink-0 place-items-center rounded-full text-white/50 transition hover:bg-white/10 hover:text-white"
            >
              <X size={13} />
            </button>
          </div>
        )}

        {/* 悬浮圆钮（未打开时轻微跳动 + 脉冲光环，引起注意） */}
        <div className={nudging ? 'animate-[cwBob_2.8s_ease-in-out_infinite]' : ''}>
          <div className="relative">
            {nudging && (
              <span
                className="pointer-events-none absolute inset-0 rounded-full border border-white/40"
                style={{ animation: 'cwPing 2.2s ease-out infinite' }}
              />
            )}
            <button
              onClick={() => {
                setOpen((v) => !v)
                setHint('dismissed')
              }}
              aria-label={open ? '收起助理' : '打开助理'}
              className="
                relative grid h-14 w-14 place-items-center rounded-full
                border border-white/20 bg-neutral-900/70 text-white
                shadow-[0_8px_30px_rgba(0,0,0,0.35)] ring-1 ring-white/5 backdrop-blur-md
                transition hover:-translate-y-0.5 hover:bg-neutral-900/90
              "
            >
              {open ? <X size={24} /> : <MessageCircle size={24} />}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
