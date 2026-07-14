// src/components/HomeRecommendations.jsx
import { useEffect, useMemo, useState } from 'react'
import ProductCard from './ProductCard'

function PagePills({ pagesCount, page, setPage }) {
  if (pagesCount <= 1) return null

  return (
    <div className="mt-6 flex justify-center">
      <div
        className="inline-flex items-center gap-3 rounded-full bg-slate-100 px-4 py-2"
        aria-label="Recommendations pagination"
      >
        {Array.from({ length: pagesCount }).map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setPage(i)}
            className={[
              'h-2.5 w-2.5 rounded-full transition',
              i === page
                ? 'bg-slate-900'
                : 'bg-slate-300 hover:bg-slate-400',
            ].join(' ')}
            aria-label={`Go to page ${i + 1}`}
          />
        ))}
      </div>
    </div>
  )
}

export default function HomeRecommendations() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        setLoading(true)
        setErr('')

        const res = await fetch('/api/products', {
          headers: { Accept: 'application/json' },
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)

        const data = await res.json()
        const list = Array.isArray(data) ? data : data?.items ?? []

        if (!alive) return
        setItems(list)
      } catch (e) {
        console.error('[popular products] fetch failed:', e)
        if (!alive) return
        setErr('Failed to load popular products.')
      } finally {
        if (!alive) return
        setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [])

  const top8 = useMemo(() => {
    const num = (v) => {
      const n = Number(v)
      return Number.isFinite(n) ? n : -Infinity
    }

    return [...items]
      .filter((p) => p?.isActive !== false)
      .sort((a, b) => num(b?.sort) - num(a?.sort))
      .slice(0, 8)
  }, [items])

  const pageSize = 4
  const pages = useMemo(() => {
    const out = []
    for (let i = 0; i < top8.length; i += pageSize) out.push(top8.slice(i, i + pageSize))
    return out
  }, [top8])

  const [page, setPage] = useState(0)
  useEffect(() => {
    if (page > Math.max(0, pages.length - 1)) setPage(0)
  }, [pages.length, page])

  const canSlide = pages.length > 1
  const prev = () => setPage((p) => (p - 1 + pages.length) % pages.length)
  const next = () => setPage((p) => (p + 1) % pages.length)

  return (
    <section className="w-full pt-8 pb-8">
      {/* ✅ 外层容器：更大的水平间距，让内容区更窄 */}
      <div className="mx-auto max-w-[1440px] px-4 sm:px-8 md:px-10 lg:px-4 py-12">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between gap-4">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            Popular Products
          </h2>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={prev}
              disabled={!canSlide}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full
                         border border-slate-200 bg-white text-slate-700 shadow-sm
                         transition hover:bg-slate-50 hover:border-slate-300
                         disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Previous"
            >
              ←
            </button>
            <button
              type="button"
              onClick={next}
              disabled={!canSlide}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full
                         border border-slate-200 bg-white text-slate-700 shadow-sm
                         transition hover:bg-slate-50 hover:border-slate-300
                         disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Next"
            >
              →
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-sm text-slate-500">Loading…</div>
        ) : err ? (
          <div className="text-sm text-red-600">{err}</div>
        ) : top8.length === 0 ? (
          <div className="text-sm text-slate-500">No popular products.</div>
        ) : (
          <>
            <div className="overflow-hidden">
              <div
                className="flex transition-transform duration-500 ease-out"
                style={{ transform: `translateX(-${page * 100}%)` }}
              >
                {pages.map((group, idx) => (
                  <div key={idx} className="w-full flex-none">
                    {/* ✅ 优化后的响应式布局：中小屏卡片更窄，间距更大 */}
                    <div
                      className={[
                        'mx-auto grid gap-4', // 基础小间距
                        'grid-cols-1 max-w-xs sm:max-w-none', // 手机: 1列，居中窄宽度
                        'sm:grid-cols-2 sm:gap-6 sm:max-w-2xl', // 小屏: 2列，更大间距
                        'md:grid-cols-2 md:gap-8 md:max-w-3xl', // 中屏: 2列，最大宽度
                        'lg:grid-cols-4 lg:gap-6 lg:max-w-none', // 大屏: 4列，正常宽度
                      ].join(' ')}
                    >
                      {group.map((p) => (
                        <ProductCard
                          key={p.id}
                          product={p}
                          // 可选：传递给ProductCard额外的样式类
                          className="mx-auto w-full"
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ✅ 胶囊导航 */}
            <PagePills pagesCount={pages.length} page={page} setPage={setPage} />
          </>
        )}
      </div>
    </section>
  )
}