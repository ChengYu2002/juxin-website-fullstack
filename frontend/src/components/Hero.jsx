// src/components/Hero.jsx
import { Link } from 'react-router-dom'

export default function Hero() {
  return (
    <section className="relative w-full overflow-hidden bg-black">
      {/* 背景图容器：手机不要太高；中大屏恢复“英雄图”高度 */}
      <div className="relative h-[420px] sm:h-[520px] md:h-[560px] lg:h-[calc(100vh-64px)] lg:min-h-[720px]">
        {/* 背景图：不同屏幕焦点不同 */}
        <img
          src="https://img.juxin-manufacturing.com/website/1-1920.webp"
          alt="Warehouse trolleys"
          loading="eager"
          fetchpriority="high"
          decoding="async"
          className="
            absolute inset-0 h-full w-full object-cover
            object-[40%_center]
            sm:object-[58%_center]
            md:object-[52%_center]
            lg:object-[16%_center]
          "
        />

        {/* 极轻压暗：中大屏更轻，手机略强一点 */}
        <div className="absolute inset-0 bg-black/18 sm:bg-black/14 md:bg-black/12 lg:bg-black/8" />

        {/* 渐变：手机用上下渐变保证可读；中大屏用右侧渐变把文案托出来 */}
        <div
          className="
            absolute inset-0
            bg-gradient-to-b from-black/55 via-black/18 to-black/10
            md:bg-gradient-to-l md:from-black/45 md:via-black/18 md:to-transparent
            lg:from-black/55 lg:via-black/22
          "
        />

        {/* ===== 文案层 ===== */}
        <div className="absolute inset-0">
          <div className="mx-auto h-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid h-full grid-cols-12">
              {/* 左侧留空：桌面保持产品视觉 */}
              <div className="hidden md:block md:col-span-7" />

              {/* 右侧文案区：中大屏开始固定在右侧 5/12 ≈ 41.7% */}
              <div className="col-span-12 md:col-span-5">
                <div
                  className="
                    flex h-full
                    items-center justify-center
                    md:items-start md:justify-end
                    pt-10 pb-10
                    sm:pt-14 sm:pb-12
                    md:pt-14 md:pb-0
                    lg:pt-24
                  "
                >
                  <div className="w-full max-w-[360px] sm:max-w-[520px] md:max-w-none md:pr-8 lg:pr-10 text-center md:text-left">
                    {/* ========= 手机：玻璃卡片 ========= */}
                    <div
                      className="
                        md:hidden
                        relative rounded-2xl
                        bg-white/[0.08]
                        border border-white/[0.22]
                        shadow-[0_8px_40px_rgba(0,0,0,0.35)]
                        px-5 py-5
                      "
                    >
                      {/* 玻璃高光反射 */}
                      <div
                        className="
                          pointer-events-none absolute inset-0 rounded-2xl
                          bg-[linear-gradient(120deg,rgba(255,255,255,0.28),rgba(255,255,255,0.02)_40%,transparent_60%)]
                          opacity-70
                        "
                      />
                      <HeroContent variant="mobile" />
                    </div>

                    {/* ========= 中大屏：无卡片，直接排版（右上40%区域） ========= */}
                    <div className="hidden md:block">
                      <HeroContent variant="desktop" />
                    </div>
                  </div>
                </div>
              </div>
            </div>{/* grid */}
          </div>
        </div>

        {/* Scroll indicator — desktop only */}
        <div
          className="
            pointer-events-none
            absolute bottom-5 left-1/2 -translate-x-1/2
            hidden md:flex
            flex-col items-center gap-1
            text-white/60
            md:bottom-8
          "
        >
          <span className="text-[11px] tracking-widest uppercase opacity-70">
            Scroll
          </span>

          <span
            className="
              block h-5 w-5
              animate-bounce
              text-white/70
            "
          >
            ↓
          </span>
          <span className="block h-[1px] w-10 bg-white/40" />
        </div>
      </div>
    </section>
  )
}

function HeroContent({ variant }) {
  const isMobile = variant === 'mobile'

  return (
    <div className={isMobile ? 'relative' : ''}>
      <h1
        className={`
          font-semibold tracking-tight text-white drop-shadow
          ${isMobile ? 'text-[32px] leading-[1.1]' : 'text-5xl leading-[1.05] lg:text-7xl lg:leading-[1.02]'}
        `}
      >
        Reliable Trolley
        <br />
        Manufacturer
      </h1>

      <p
        className={`
          mt-4 text-white/85
          ${isMobile ? 'text-[14px] leading-6' : 'text-lg leading-7 lg:mt-6 lg:text-2xl'}
        `}
      >
        OEM &amp; ODM solutions trusted by global retailers
      </p>

      {/* 按钮：手机玻璃；中大屏更“官网化” */}
      <div
        className={`
          mt-6 grid gap-3
          ${isMobile ? 'sm:grid-cols-2' : 'md:grid-cols-1 lg:flex lg:gap-4'}
        `}
      >
        <Link
          to="/products?category=shopping-trolley"
          className={
            isMobile
              ? `
                inline-flex h-12 w-full items-center justify-center rounded-md
                bg-blue-500/20 border border-blue-400/40
                text-sm font-semibold text-white
                backdrop-saturate-150 transition
                hover:bg-blue-500/30 hover:border-blue-400/60
              `
              : `
                inline-flex h-12 items-center justify-center rounded-md
                bg-blue-600 px-7
                text-sm font-semibold text-white
                shadow-sm transition hover:bg-blue-500
              `
          }
        >
          View Products
        </Link>

        <Link
          to="/contact"
          className={
            isMobile
              ? `
                inline-flex h-12 w-full items-center justify-center rounded-md
                bg-white/10 border border-white/30
                text-sm font-semibold text-white
                transition hover:bg-white/20 hover:border-white/50
              `
              : `
                inline-flex h-12 items-center justify-center rounded-md
                border border-white/25 bg-white/0 px-7
                text-sm font-semibold text-white
                transition hover:bg-white/10
              `
          }
        >
          Contact for Quote
        </Link>
      </div>

      <p className={`mt-5 text-white/60 ${isMobile ? 'text-[12px]' : 'text-sm lg:mt-8'}`}>
        MOQ from 1000 pcs · Export-ready packing · Audited facilities
      </p>
    </div>
  )
}
