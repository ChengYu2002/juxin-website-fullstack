import { useEffect, useState } from 'react'

const CERT_FILES = ['ISO_Envrioment.webp', 'ISO_Quality.webp', 'Health_Safe.webp', 'Social_Resp.webp', 'Workplace.webp', 'CE1.webp', 'CE2.webp']

const certList = CERT_FILES.map((file) => ({
  id: file,
  title: file.split('.')[0],
  src: `https://img.juxin-manufacturing.com/website/${file}`,
}))

function getPageSize() {
  if (window.innerWidth < 640) return 1      // mobile
  if (window.innerWidth < 1024) return 2     // tablet
  return 3                                   // desktop
}

export default function Certifications() {
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(getPageSize)

  // 监听窗口变化（响应式分页）
  useEffect(() => {
    const onResize = () => {
      setPageSize(getPageSize())
      setPage(0) // 断点变化时回到第一页，避免越界
    }

    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const pageCount = Math.ceil(certList.length / pageSize)

  const currentItems = certList.slice(
    page * pageSize,
    page * pageSize + pageSize
  )

  return (
    <section className="bg-white">
      <div className="mx-auto max-w-6xl px-6 lg:px-8 pt-8 pb-14 sm:pt-10 sm:pb-16">
        <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900">
          Certifications
        </h2>

        {/* Pager */}
        <div className="mt-10 flex items-center gap-3 sm:gap-4">
          {/* Left */}
          <button
            onClick={() => setPage((p) => Math.max(p - 1, 0))}
            disabled={page === 0}
            className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full border border-slate-300 text-slate-600 hover:bg-slate-100 disabled:opacity-30"
          >
            ←
          </button>

          {/* Cards */}
          <div className="grid flex-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {currentItems.map((c) => (
              <a
                key={c.id}
                href={c.src}
                target="_blank"
                rel="noreferrer"
                className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
              >
                <div className="aspect-[3/4] bg-slate-50">
                  <img
                    src={c.src}
                    alt={c.title}
                    className="h-full w-full object-contain p-4 sm:p-5"
                    loading="lazy"
                  />
                </div>
              </a>
            ))}
          </div>

          {/* Right */}
          <button
            onClick={() => setPage((p) => Math.min(p + 1, pageCount - 1))}
            disabled={page === pageCount - 1}
            className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full border border-slate-300 text-slate-600 hover:bg-slate-100 disabled:opacity-30"
          >
            →
          </button>
        </div>

        {/* Indicator */}
        <div className="mt-6 flex justify-center gap-2">
          {Array.from({ length: pageCount }).map((_, i) => (
            <span
              key={i}
              className={`h-1.5 w-5 rounded-full ${
                i === page ? 'bg-slate-900' : 'bg-slate-300'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
