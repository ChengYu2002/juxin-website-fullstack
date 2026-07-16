// src/components/ChatWidget/ChatWidget.jsx
// 售前 AI 助理浮动气泡（P1：纯对话）
// - 前端持有 messages[] 历史，每次整包发给 /api/chat（模型无状态，历史即记忆）
// - 匿名 conversationId 存 localStorage（P4 会用它把对话关联到询盘）
// - 视觉：深色毛玻璃；桌面右下浮窗，手机全屏 sheet
// - 手机键盘处理（iOS Safari 最难点）：
//     · 真锁背景：body{position:fixed} 记录/恢复滚动位置（overflow:hidden 在 iOS 不够）
//     · 输入框随键盘：visualViewport 改面板高度 + translateY(offsetTop)，稳在键盘上方
// - 输入：自动长高；回车发送但尊重中文输入法组词（isComposing 不误发）

import { useEffect, useRef, useState } from 'react'
import { MessageCircle, X, Send } from 'lucide-react'
import { sendChat } from '../../services/chatService'

const CID_KEY = 'juxin_chat_cid'

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
  const [messages, setMessages] = useState([WELCOME])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [hint, setHint] = useState('hidden') // 'hidden' | 'shown' | 'dismissed'
  const [isMobile, setIsMobile] = useState(false)
  const [vp, setVp] = useState(null) // 手机键盘时的可视视口 { height, offsetTop }

  const listRef = useRef(null)
  const cidRef = useRef(null)
  const taRef = useRef(null)

  // 是否手机视口（< sm）
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)')
    const on = () => setIsMobile(mq.matches)
    on()
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])

  // 进站 2.5s 后冒出提醒（未开过 / 未关掉时）
  useEffect(() => {
    if (open || hint !== 'hidden') return
    const t = setTimeout(() => setHint('shown'), 2500)
    return () => clearTimeout(t)
  }, [open, hint])

  // 打开时才生成 conversationId
  useEffect(() => {
    if (open && !cidRef.current) cidRef.current = getConversationId()
  }, [open])

  // 手机全屏打开时：真锁背景（iOS 可靠做法 = body position:fixed + 记录/恢复滚动位置）
  useEffect(() => {
    if (!open || !isMobile) return
    const scrollY = window.scrollY
    const body = document.body
    const saved = {
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
    }
    body.style.position = 'fixed'
    body.style.top = `-${scrollY}px`
    body.style.left = '0'
    body.style.right = '0'
    body.style.width = '100%'
    return () => {
      Object.assign(body.style, saved)
      window.scrollTo(0, scrollY)
    }
  }, [open, isMobile])

  // 手机键盘弹出：用 visualViewport 让面板贴合可视区，输入框稳在键盘上方
  useEffect(() => {
    if (!open || !isMobile) return
    const v = window.visualViewport
    if (!v) return
    const on = () => setVp({ height: v.height, offsetTop: v.offsetTop })
    on()
    v.addEventListener('resize', on)
    v.addEventListener('scroll', on)
    return () => {
      v.removeEventListener('resize', on)
      v.removeEventListener('scroll', on)
      setVp(null)
    }
  }, [open, isMobile])

  // 新消息/加载态变化时滚到底
  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight
  }, [messages, loading, vp])

  // 输入框自动长高（封顶 140px 后内部滚动）
  useEffect(() => {
    const el = taRef.current
    if (!el) return
    el.style.height = '0px'
    el.style.height = Math.min(el.scrollHeight, 140) + 'px'
  }, [input, open])

  async function handleSend() {
    const text = input.trim()
    if (!text || loading) return
    const nextMessages = [...messages, { role: 'user', content: text }]
    setMessages(nextMessages)
    setInput('')
    setError(null)
    setLoading(true)
    try {
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
    if (e.key !== 'Enter' || e.shiftKey) return
    // 中文/日文等输入法组词中：回车是"确认候选词"，绝不当发送
    if (e.nativeEvent.isComposing || e.keyCode === 229) return
    e.preventDefault()
    handleSend()
  }

  const nudging = !open && hint !== 'dismissed'

  // 手机端：面板尺寸/位置跟随 visualViewport（键盘弹出时不漂）
  const mobilePanelStyle =
    isMobile && open
      ? {
          height: vp ? `${vp.height}px` : '100dvh',
          transform: vp ? `translateY(${vp.offsetTop}px)` : undefined,
          animation: 'cwFade .2s ease-out',
        }
      : { animation: 'cwIn .22s ease-out' }

  return (
    <>
      <style>{`
        @keyframes cwIn{from{opacity:0;transform:translateY(12px) scale(.98)}to{opacity:1;transform:none}}
        @keyframes cwFade{from{opacity:0}to{opacity:1}}
        @keyframes cwPing{0%{transform:scale(1);opacity:.5}70%{opacity:0}100%{transform:scale(1.9);opacity:0}}
        @keyframes cwHintIn{from{opacity:0;transform:translateX(10px) scale(.96)}to{opacity:1;transform:none}}
        @keyframes cwBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
      `}</style>

      {/* 对话面板：手机全屏 sheet（跟随键盘），桌面右下浮窗 */}
      {open && (
        <div
          role="dialog"
          aria-label="巨鑫售前助理"
          style={mobilePanelStyle}
          className="
            fixed z-[1001] flex flex-col overflow-hidden text-white
            inset-x-0 top-0 left-0 rounded-none border-0 bg-neutral-950
            sm:inset-auto sm:top-auto sm:right-6 sm:bottom-24 sm:h-[560px] sm:w-[370px]
            sm:max-h-[calc(100dvh-8rem)] sm:rounded-2xl sm:border sm:border-white/15 sm:bg-neutral-950/60
            backdrop-blur-xl shadow-[0_16px_50px_rgba(0,0,0,0.5)]
          "
        >
          {/* 玻璃高光反射（仅桌面明显） */}
          <div className="pointer-events-none absolute inset-0 hidden bg-[linear-gradient(120deg,rgba(255,255,255,0.12),rgba(255,255,255,0.02)_40%,transparent_60%)] sm:block" />

          <div className="relative z-10 flex h-full flex-col">
            {/* 头部 */}
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
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
              className="flex flex-1 flex-col gap-2.5 overflow-y-auto overscroll-contain px-4 py-4 [scrollbar-color:rgba(255,255,255,0.25)_transparent] [scrollbar-width:thin]"
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

            {/* 输入区 —— 自动长高；text-base(16px) 防 iOS 缩放；底部安全区 */}
            <div className="flex items-end gap-2 border-t border-white/10 px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              <textarea
                ref={taRef}
                rows={1}
                placeholder="输入问题…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
                className="
                  max-h-[140px] min-h-[40px] flex-1 resize-none overflow-y-auto rounded-xl border border-white/15
                  bg-white/10 px-3 py-2 text-base leading-relaxed text-white placeholder-white/40
                  outline-none backdrop-blur transition focus:border-white/40 sm:text-sm
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
        {nudging && hint === 'shown' && (
          <div
            style={{ animation: 'cwHintIn .3s ease-out' }}
            className="
              flex max-w-[80vw] items-center gap-1 whitespace-nowrap rounded-full
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
              👋 你好，我是售前助理 Jason
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

        {/* 悬浮圆钮（未打开时：双层脉冲光环 + 轻微跳动，稍显眼但克制） */}
        <div className={nudging ? 'animate-[cwBob_2.8s_ease-in-out_infinite]' : ''}>
          <div className="relative">
            {nudging && (
              <>
                <span
                  className="pointer-events-none absolute inset-0 rounded-full border border-white/45"
                  style={{ animation: 'cwPing 2.2s ease-out infinite' }}
                />
                <span
                  className="pointer-events-none absolute inset-0 rounded-full border border-white/30"
                  style={{ animation: 'cwPing 2.2s ease-out infinite', animationDelay: '1.1s' }}
                />
              </>
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
