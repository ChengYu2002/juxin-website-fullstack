import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import TypewriterTitle from '../components/TypewriterTitle'
import { adminFetch } from '../../services/adminApi' // 按你项目实际路径改

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState([])
  const [inquiries, setInquiries] = useState([])
  const [err, setErr] = useState('')

  useEffect(() => {
    const aliveRef = { current: true }

    ;(async () => {
      try {
        setLoading(true)
        setErr('')

        const [ps, ins] = await Promise.all([
          adminFetch('/api/products/admin'),
          adminFetch('/api/inquiries/admin'),
        ])

        if (aliveRef.current) {
          setProducts(Array.isArray(ps) ? ps : ps?.items ?? [])
          setInquiries(Array.isArray(ins) ? ins : ps?.items ?? [])
        }
      } catch (e) {
        console.error(e)
        if (aliveRef.current) {
          setErr('概览数据加载失败（请尝试重新登录）')
        }
      } finally {
        if (aliveRef.current) {
          setLoading(false)
        }
      }
    })()

    return () => {
      aliveRef.current = false
    }
  }, [])

  // ✅ 用 inquiry.status：new / done 来做跟踪统计（不改 schema）
  const stats = useMemo(() => {
    const totalProducts = products.length
    const activeProducts = products.filter((p) => !!p?.isActive).length
    const inactiveProducts = totalProducts - activeProducts

    const totalInquiries = inquiries.length
    const trackedInquiries = inquiries.filter((x) => x?.status === 'done').length
    const untrackedInquiries = totalInquiries - trackedInquiries

    const activeRate =
      totalProducts === 0 ? 0 : Math.round((activeProducts / totalProducts) * 100)

    const trackedRate =
      totalInquiries === 0 ? 0 : Math.round((trackedInquiries / totalInquiries) * 100)

    return {
      products: {
        total: totalProducts,
        active: activeProducts,
        inactive: inactiveProducts,
        activeRate,
      },
      inquiries: {
        total: totalInquiries,
        tracked: trackedInquiries,
        untracked: untrackedInquiries,
        trackedRate,
      },
    }
  }, [products, inquiries])

  return (
    <div className="relative overflow-hidden rounded-3xl border bg-slate-950 shadow-sm">
      {/* 背景：渐变 + 网格 + 光晕 */}
      <div className="absolute inset-0 bg-[radial-gradient(1100px_circle_at_18%_18%,rgba(56,189,248,0.28),transparent_55%),radial-gradient(900px_circle_at_85%_25%,rgba(99,102,241,0.22),transparent_55%),radial-gradient(900px_circle_at_50%_95%,rgba(16,185,129,0.16),transparent_60%)]" />
      <div
        className="absolute inset-0 opacity-[0.10]"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(255,255,255,0.22) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.22) 1px, transparent 1px)',
          backgroundSize: '34px 34px',
        }}
      />
      <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-cyan-400/20 blur-3xl" />
      <div className="absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-indigo-400/15 blur-3xl" />

      <div className="relative p-8 md:p-10">
        {/* 小状态 */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs text-white/80 ring-1 ring-white/15">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.65)]" />
            系统正常 · 控制台模式
          </div>

          {loading ? (
            <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-xs text-white/60 ring-1 ring-white/10">
              <span className="h-1.5 w-1.5 rounded-full bg-white/50 animate-pulse" />
              正在加载概览数据…
            </div>
          ) : err ? (
            <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-xs text-amber-200/90 ring-1 ring-amber-200/20">
              {err}
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-xs text-white/60 ring-1 ring-white/10">
              数据已更新
            </div>
          )}
        </div>

        {/* 打字大标题 */}
        <div className="mt-6">
          <TypewriterTitle />
        </div>

        {/* 三个入口 */}
        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          <EntryCard
            tone="cyan"
            title="产品管理"
            desc="编辑 / 上下架 / 排序权重 / 颜色种类/配置"
            to="/admin/products"
            cta="进入"
          />

          <EntryCard
            tone="indigo"
            title="上架新产品"
            desc="快速新建产品"
            to="/admin/products-create"
            cta="新建"
            primary
          />

          <EntryCard
            tone="emerald"
            title="询盘管理"
            desc="查看客户询盘与跟进记录"
            to="/admin/inquiries"
            cta="查看"
          />
        </div>

        {/* ✅ 统计区域：只保留两块（产品概览 + 询盘圆环），删掉“数据来源那一格” */}
        <div className="mt-10 grid gap-4 lg:grid-cols-2">
          {/* 产品统计 */}
          <Panel tone="cyan" title="产品发布概览">
            <div className="grid grid-cols-3 gap-3">
              <MiniStat label="总产品" value={stats.products.total} />
              <MiniStat label="上架" value={stats.products.active} />
              <MiniStat label="下架" value={stats.products.inactive} />
            </div>

            <div className="mt-4 flex items-center justify-between text-sm text-white/70">
              <span>上架率</span>
              <span className="text-white/90">{stats.products.activeRate}%</span>
            </div>
            <ProgressBar value={stats.products.activeRate} tone="cyan" />

            <div className="mt-5">
              <BarCompare
                aLabel="上架"
                aValue={stats.products.active}
                bLabel="下架"
                bValue={stats.products.inactive}
              />
            </div>
          </Panel>

          {/* 询盘圆环 */}
          <Panel tone="emerald" title="询盘跟踪状态">
            <div className="flex items-center gap-5">
              <Donut
                value={stats.inquiries.tracked}
                total={stats.inquiries.total}
                tone="emerald"
                label="已跟踪"
              />

              <div className="space-y-2 text-sm text-white/75">
                <LegendRow
                  dot="bg-emerald-400"
                  label="已跟踪（done）"
                  value={stats.inquiries.tracked}
                />
                <LegendRow
                  dot="bg-white/25"
                  label="未跟踪（new）"
                  value={stats.inquiries.untracked}
                />

                <div className="pt-2 text-xs text-white/55">
                  跟踪率：{stats.inquiries.trackedRate}%
                </div>
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between text-l text-white/70">
                <span>总询盘</span>
                <span className="text-white/1000">{stats.inquiries.total}</span>
              </div>
              {/* <div className="mt-2 text-xs text-white/55">
                统计口径：status = done 视为已跟踪；status = new 视为未跟踪。
              </div> */}
            </div>
          </Panel>
        </div>
      </div>

      <style>{`
        @keyframes rise {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .rise { animation: rise 520ms ease-out both; }
      `}</style>
    </div>
  )
}

/* -------------------- UI Components -------------------- */

function EntryCard({ tone, title, desc, to, cta, primary }) {
  const toneMap = {
    cyan: {
      dot: 'bg-cyan-400',
      ring: 'ring-cyan-300/25',
      glow: 'from-cyan-500/20 to-transparent',
      btn: primary
        ? 'bg-cyan-600 text-white hover:bg-cyan-700'
        : 'border-cyan-200/40 text-cyan-100 hover:bg-white/5',
    },
    indigo: {
      dot: 'bg-indigo-400',
      ring: 'ring-indigo-300/25',
      glow: 'from-indigo-500/20 to-transparent',
      btn: primary
        ? 'bg-indigo-600 text-white hover:bg-indigo-700'
        : 'border-indigo-200/40 text-indigo-100 hover:bg-white/5',
    },
    emerald: {
      dot: 'bg-emerald-400',
      ring: 'ring-emerald-300/25',
      glow: 'from-emerald-500/20 to-transparent',
      btn: primary
        ? 'bg-emerald-600 text-white hover:bg-emerald-700'
        : 'border-emerald-200/40 text-emerald-100 hover:bg-white/5',
    },
  }
  const t = toneMap[tone] || toneMap.cyan

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/7 hover:shadow-md">
      <div
        className={[
          'pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-gradient-to-br blur-2xl',
          t.glow,
        ].join(' ')}
      />
      <div className={['absolute inset-0 ring-1', t.ring].join(' ')} />

      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className={['h-2.5 w-2.5 rounded-full', t.dot].join(' ')} />
              <h3 className="text-base font-semibold text-white">{title}</h3>
            </div>
            <p className="mt-2 text-sm text-white/65">{desc}</p>
          </div>
        </div>

        <div className="mt-4">
          <Link
            to={to}
            className={[
              'inline-flex items-center justify-center rounded-xl border px-3 py-2 text-sm transition',
              'shadow-[0_8px_28px_rgba(0,0,0,0.18)]',
              t.btn,
            ].join(' ')}
          >
            {cta}
            <span className="ml-2 opacity-70 group-hover:translate-x-0.5 transition">
              →
            </span>
          </Link>
        </div>
      </div>
    </div>
  )
}

function Panel({ title, children, tone }) {
  const toneMap = {
    cyan: {
      ring: 'ring-cyan-300/18',
      glow: 'from-cyan-500/18 to-transparent',
      title: 'text-cyan-50',
    },
    emerald: {
      ring: 'ring-emerald-300/18',
      glow: 'from-emerald-500/18 to-transparent',
      title: 'text-emerald-50',
    },
    indigo: {
      ring: 'ring-indigo-300/18',
      glow: 'from-indigo-500/18 to-transparent',
      title: 'text-indigo-50',
    },
  }
  const t = toneMap[tone] || toneMap.cyan

  return (
    <div className="rise group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 shadow-sm backdrop-blur">
      <div
        className={[
          'pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-gradient-to-br blur-3xl',
          t.glow,
        ].join(' ')}
      />
      <div className={['absolute inset-0 ring-1', t.ring].join(' ')} />
      <div className="relative">
        <div className={['text-sm font-semibold', t.title].join(' ')}>
          {title}
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  )
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
      <div className="text-xs text-white/55">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-white tabular-nums">
        {value}
      </div>
    </div>
  )
}

function ProgressBar({ value, tone }) {
  const toneMap = {
    cyan: 'bg-cyan-400/70',
    emerald: 'bg-emerald-400/70',
    indigo: 'bg-indigo-400/70',
  }
  const bar = toneMap[tone] || toneMap.cyan

  return (
    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/10">
      <div
        className={['h-full rounded-full transition-all duration-700', bar].join(
          ' '
        )}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  )
}

function BarCompare({ aLabel, aValue, bLabel, bValue }) {
  const max = Math.max(1, aValue, bValue)
  const aPct = Math.round((aValue / max) * 100)
  const bPct = Math.round((bValue / max) * 100)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm text-white/70">
        <span>上架 vs 下架（柱状对比）</span>
        <span className="text-xs text-white/50">max = {max}</span>
      </div>

      <BarRow label={aLabel} value={aValue} pct={aPct} tone="a" />
      <BarRow label={bLabel} value={bValue} pct={bPct} tone="b" />
    </div>
  )
}

function BarRow({ label, value, pct, tone }) {
  const bar = tone === 'a' ? 'bg-cyan-400/70' : 'bg-white/20'
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs text-white/60">
        <span>{label}</span>
        <span className="tabular-nums">{value}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className={['h-full rounded-full transition-all duration-700', bar].join(
            ' '
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

function Donut({ value, total, tone, label }) {
  const pct = total === 0 ? 0 : Math.round((value / total) * 100)
  const color =
    tone === 'emerald'
      ? 'rgba(16,185,129,0.85)'
      : tone === 'cyan'
        ? 'rgba(56,189,248,0.85)'
        : 'rgba(99,102,241,0.85)'

  const bg = 'rgba(255,255,255,0.18)'
  const conic = `conic-gradient(${color} ${pct}%, ${bg} 0)`

  return (
    <div className="relative grid h-28 w-28 place-items-center">
      <div
        className="h-28 w-28 rounded-full"
        style={{
          background: conic,
          boxShadow: '0 0 24px rgba(0,0,0,0.25)',
        }}
      />
      <div className="absolute grid h-[78%] w-[78%] place-items-center rounded-full bg-slate-950/80 ring-1 ring-white/10 backdrop-blur">
        <div className="text-lg font-semibold text-white tabular-nums">
          {pct}%
        </div>
        <div className="text-[11px] text-white/55">{label}</div>
      </div>
    </div>
  )
}

function LegendRow({ dot, label, value }) {
  return (
    <div className="flex items-center justify-between gap-6">
      <div className="flex items-center gap-2">
        <span className={['h-2.5 w-2.5 rounded-full', dot].join(' ')} />
        <span className="text-white/70">{label}</span>
      </div>
      <span className="text-white/90 tabular-nums">{value}</span>
    </div>
  )
}
