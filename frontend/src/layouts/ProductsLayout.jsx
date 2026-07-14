import { Outlet, NavLink, useSearchParams } from 'react-router-dom'
import {
  Layers,
  ShoppingBag,
  Truck,
  Car,
  Tent,
  Move,
  Backpack
} from 'lucide-react'

const CATEGORIES = [
  { key: '', label: 'All Products' },
  { key: 'shopping-trolley', label: 'Shopping Trolley' },
  { key: 'utility-trolley', label: 'Utility Trolley' },
  { key: 'camping-wagon', label: 'Camping Wagon' },
  { key: 'outdoor-furniture', label: 'Outdoor Furniture' },
]

function CategoryIcon({ k, className }) {
  switch (k) {
  case '':
    return <Layers className={className} />
  case 'shopping-trolley':
    return <ShoppingBag className={className} />
  case 'utility-trolley':
    return <Truck className={className} />
  case 'camping-wagon':
    return <Backpack className={className} />
  case 'outdoor-furniture':
    return <Tent className={className} />
  default:
    return null
  }
}

export default function ProductsLayout() {
  const [searchParams] = useSearchParams()
  const active = searchParams.get('category') || ''

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      {/* ✅ Category pills */}
      <div className="-mx-6 px-6">
        <div className="flex flex-wrap gap-2 md:gap-3">
          {CATEGORIES.map((c) => {
            const to = c.key ? `?category=${encodeURIComponent(c.key)}` : ''
            const isActive = active === c.key

            const iconClass = [
              'h-4 w-4',
              'transition-colors',
              isActive ? 'text-white/90' : 'text-gray-500 group-hover:text-gray-700',
            ].join(' ')

            return (
              <NavLink
                key={c.key || 'all'}
                to={to}
                className={[
                  'group inline-flex items-center gap-2',
                  'rounded-full px-4 py-2 text-sm',
                  'border transition-all duration-200',
                  'hover:-translate-y-[1px] hover:shadow-sm',
                  'active:translate-y-0 active:shadow-none',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900/20',
                  isActive
                    ? 'bg-gray-900 text-white border-gray-900 shadow-sm'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:border-gray-300',
                ].join(' ')}
              >
                <CategoryIcon k={c.key} className={iconClass} />
                <span>{c.label}</span>
              </NavLink>
            )
          })}
        </div>
      </div>

      {/* ✅ Content */}
      <section className="mt-6 min-w-0">
        <Outlet />
      </section>
    </main>
  )
}
