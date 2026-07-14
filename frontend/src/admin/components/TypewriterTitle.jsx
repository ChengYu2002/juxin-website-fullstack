import { useEffect, useMemo, useState } from 'react'

const TITLE_TEXT = '欢迎来到 JUXIN 管理后台 :)'
const SUBTITLE = '开发：ChengYu2002 · JuxinTeam · © 2026'

export default function TypewriterTitle() {
  const [text, setText] = useState('')
  const [index, setIndex] = useState(0)

  const done = useMemo(() => index >= TITLE_TEXT.length, [index])

  useEffect(() => {
    if (index >= TITLE_TEXT.length) return

    const timer = setTimeout(() => {
      setText((t) => t + TITLE_TEXT[index])
      setIndex((i) => i + 1)
    }, 80)

    return () => clearTimeout(timer)
  }, [index])

  return (
    <div>
      <h1 className="relative text-3xl font-semibold tracking-tight text-white md:text-5xl">
        {renderText(text)}
        <span
          className={[
            'ml-1 inline-block h-[1em] w-[2px] align-middle',
            done ? 'animate-pulse bg-white/80' : 'bg-white',
          ].join(' ')}
        />
      </h1>

      {/* 规范副标题：更小、更克制、更结构化 */}
      <p
        className={[
          'mt-3 text-sm text-white/60 md:text-base',
          done ? 'opacity-100' : 'opacity-90',
        ].join(' ')}
      >
        {SUBTITLE}
      </p>
    </div>
  )
}

function renderText(text) {
  const parts = text.split('JUXIN')
  if (parts.length === 1) return text

  return (
    <>
      {parts[0]}
      <span className="text-cyan-300 drop-shadow-[0_0_18px_rgba(56,189,248,0.25)]">
        JUXIN
      </span>
      {parts[1]}
    </>
  )
}

