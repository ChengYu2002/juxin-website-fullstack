// src/components/PartnersMarquee.jsx
import { useMemo } from 'react'
import { useImg } from '../context/ImageRegionContext'

export default function PartnersMarquee() {
  const imgSrc = useImg()
  const partners = useMemo(
    () => [
      { name: 'ALDI', src: 'https://img.juxin-manufacturing.com/website/aldi.svg', scale: 1.5 },
      { name: 'Carrefour', src: 'https://img.juxin-manufacturing.com/website/carrefour.svg', scale: 1.5 },
      { name: 'Heineken', src: 'https://img.juxin-manufacturing.com/website/heineken.svg', scale: 1 },
      { name: 'DAISO', src: 'https://img.juxin-manufacturing.com/website/daiso.svg', scale: 1 },
      { name: 'Lee Kum Kee', src: 'https://img.juxin-manufacturing.com/website/lee-kum-kee.svg', scale: 3 },
      { name: 'Woolworth', src: 'https://img.juxin-manufacturing.com/website/woolworth.svg', scale: 2.2 },
    ],
    []
  )

  const track = [...partners, ...partners] // 只给桌面跑马灯用

  const Card = ({ p }) => (
    <div
      className="
        snap-center
        flex items-center justify-center
        h-24 sm:h-32
        min-w-[132px] sm:min-w-[200px] lg:min-w-[220px]
        max-w-[132px] sm:max-w-[200px] lg:max-w-[220px]
        rounded-xl sm:rounded-2xl
        bg-white
        px-5 sm:px-8
        shadow-[0_10px_32px_rgba(15,23,42,0.08)]
        transition
        hover:shadow-[0_18px_60px_rgba(15,23,42,0.12)]
      "
      title={p.name}
    >
      <div className="flex h-8 items-center justify-center sm:h-14">
        <img
          src={imgSrc(p.src)}
          alt={p.name}
          loading="lazy"
          draggable="false"
          className="h-8 w-auto object-contain sm:h-14"
          style={{
            transform: `scale(${p.scale ?? 1})`,
            transformOrigin: 'center',
          }}
        />
      </div>
    </div>
  )

  return (
    <section className="w-full bg-white">
      <div className="mx-auto max-w-screen-2xl px-4 py-10 sm:px-6 sm:py-14 lg:px-10">
        <h2 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl lg:text-4xl">
          Our Partners & Customers
        </h2>

        <div className="relative mt-6 sm:mt-10">
          {/* 桌面端渐隐遮罩 */}
          <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-16 bg-gradient-to-r from-white via-white/70 to-transparent sm:block" />
          <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-16 bg-gradient-to-l from-white via-white/70 to-transparent sm:block" />

          {/* ✅ Mobile：纯滑动（无动画） */}
          <div
            className="
              sm:hidden
              overflow-x-auto overflow-y-hidden
              scroll-smooth
              snap-x snap-mandatory
              [-webkit-overflow-scrolling:touch]
            "
          >
            <div className="flex w-max items-center gap-4 py-4">
              {partners.map((p) => (
                <Card key={p.name} p={p} />
              ))}
            </div>

            <div className="mt-2 text-xs text-slate-400">
              Swipe to explore →
            </div>
          </div>

          {/* ✅ Desktop：跑马灯（有动画） */}
          <div className="hidden sm:block overflow-hidden">
            <div className="group">
              <div
                className="
                  flex w-max items-center gap-12 py-6
                  animate-marquee
                  group-hover:[animation-play-state:paused]
                "
              >
                {track.map((p, idx) => (
                  <Card key={`${p.name}-${idx}`} p={p} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
