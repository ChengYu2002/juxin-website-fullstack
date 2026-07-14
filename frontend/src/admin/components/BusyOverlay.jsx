// src/admin/components/BusyOverlay.jsx
import React, { useEffect } from 'react'
import { createPortal } from 'react-dom'

function CloudSpinner() {
  return (
    <svg
      viewBox="-6 -8 92 66"
      className="w-14 h-10 shrink-0 text-blue-600 overflow-visible"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M25 40h32a14 14 0 0 0 0-28 18 18 0 0 0-35-4A13 13 0 0 0 25 40Z"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="cloud-stroke"
      />
    </svg>
  )
}

export default function BusyOverlay({
  open,
  text = '云端操作中，请耐心等候',
  subtext = '请勿刷新或关闭页面',
}) {
  // 🔒 锁滚动（并保证恢复）
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  if (!open) return null

  // ✅ Portal 到 body：彻底避免父容器 stacking context 导致“漏”
  return createPortal(
    <div
      className="fixed left-0 top-0 w-screen h-screen z-[2147483647] isolate flex items-center justify-center"
      role="alert"
      aria-live="polite"
      aria-busy="true"
    >
      {/* ✅ 背景：轻 blur + 更暗遮盖（你要的：不“糊到没边”，但也看不清内容） */}
      <div className="absolute inset-0 bg-white/10 backdrop-blur-md" />

      {/* 卡片 */}
      <div
        className="
          relative
          flex items-center gap-3
          px-6 py-4
          rounded-2xl
          bg-white/95
          border border-gray-200/70
          shadow-[0_18px_55px_rgba(0,0,0,0.20)]
          min-w-[340px]
        "
      >
        <CloudSpinner />

        <div className="flex flex-col leading-tight">
          <div className="text-[17px] font-semibold text-gray-900">
            {text}
          </div>
          <div className="mt-1 text-sm text-gray-500">
            {subtext}
          </div>
        </div>
      </div>

      <style>{`
        .cloud-stroke {
          stroke-dasharray: 180;
          stroke-dashoffset: 160;
          animation: cloudDash 1.2s ease-in-out infinite;
        }
        @keyframes cloudDash {
          0%   { stroke-dashoffset: 180; opacity: 0.55; }
          50%  { stroke-dashoffset: 90;  opacity: 1; }
          100% { stroke-dashoffset: 0;   opacity: 0.55; }
        }
      `}</style>
    </div>,
    document.body
  )
}
