// src/pages/Products.jsx
import { useEffect, useState } from 'react'
import ProductCard from '../components/ProductCard'
import { useSearchParams } from 'react-router-dom'
import Seo from '../components/Seo'

export default function Products() {
  const [searchParams] = useSearchParams()
  const category = searchParams.get('category')

  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const titleCategory = category
    ? category
      .replace(/-/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase())
    : ''

  // pagination
  const PAGE_SIZE = 12
  const [currentPage, setCurrentPage] = useState(1)

  // 初始化: 打开页面永远滚动到顶部
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [category, currentPage])

  // 拉产品列表（随 category 变化）
  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true)
      setError('')

      try {
        const qs = category ? `?category=${encodeURIComponent(category)}` : ''
        const res = await fetch(`/api/products${qs}`)

        // 先尽量把后端错误信息读出来（如果有）
        if (!res.ok) {
          let msg = 'Failed to load products'
          try {
            const errData = await res.json()
            msg = errData?.message || msg
          } catch {
            // ignore json parse error
          }
          throw new Error(msg)
        }

        const data = await res.json()

        // 兼容三种常见返回：[] / {items:[]} / {products:[]}
        const list = Array.isArray(data)
          ? data
          : (Array.isArray(data?.items) ? data.items : Array.isArray(data?.products) ? data.products : [])

        setProducts(list)
      } catch (e) {
        setError(e?.message || 'Failed to load products')
        setProducts([]) // 出错时清空，避免显示旧数据
      } finally {
        setLoading(false)
      }
    }

    loadProducts()
  }, [category])

  // filter 改变时：回到第 1 页
  useEffect(() => {
    setCurrentPage(1)
  }, [category])

  // ===== 分页 =====
  const displayProducts = products
  const totalPages = Math.ceil(displayProducts.length / PAGE_SIZE)

  const pagedProducts = displayProducts.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  )

  // ===== currentPage 超出 totalPages 时，调整 currentPage =====
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages || 1)
    }
  }, [totalPages, currentPage])

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <Seo
        title={category ? `${titleCategory}` : 'All Products'}
        description={
          category
            ? `Browse Juxin ${titleCategory.toLowerCase()} — specifications, MOQ and export packing for wholesale and OEM/ODM buyers.`
            : 'Browse the full Juxin product range — shopping trolleys, utility carts, camping wagons and outdoor furniture for wholesale and OEM/ODM buyers.'
        }
        path={category ? `/products?category=${category}` : '/products'}
      />
      <h1 className="mb-6 text-2xl font-bold">
        {category ? `Products / ${titleCategory}` : 'All Products'}
      </h1>

      {/* Loading */}
      {loading && (
        <div className="rounded border bg-white p-4 text-sm text-gray-600">
          Loading products...
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Empty */}
      {!loading && !error && products.length === 0 && (
        <div className="rounded border bg-white p-4 text-sm text-gray-600">
          No products found{category ? ` for category "${category}"` : ''}.
        </div>
      )}

      {/* List */}
      {!loading && !error && products.length > 0 && (
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
          {pagedProducts.map((p) => (
            <ProductCard
              key={p.id || p._id || p.slug}
              product={p}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-10 flex items-center justify-center gap-5 text-sm text-gray-600">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="rounded-full border px-3 py-1 transition
                      hover:bg-gray-100 disabled:opacity-30"
          >
            ←
          </button>

          <span>
            Page <span className="font-medium text-gray-800">{currentPage}</span>
            <span className="mx-1 text-gray-400">/</span>
            {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="rounded-full border px-3 py-1 transition
                      hover:bg-gray-100 disabled:opacity-30"
          >
            →
          </button>
        </div>
      )}
    </main>
  )
}
