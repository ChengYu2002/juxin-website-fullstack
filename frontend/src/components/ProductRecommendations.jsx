// src/components/ProductRecommendations.jsx
import { useEffect, useMemo, useState } from 'react'
import ProductCard from './ProductCard'

// 权重计算函数
const calculateProductScore = (product, currentProduct) => {
  let score = 0

  // 1. 同类产品：40分（最高权重）
  if (product.category === currentProduct.category) {
    score += 45
  }

  // 2. 高利润产品：35分（B2B核心）
  if (product.profitMargin === 'high') {
    score += 35
  } else if (product.profitMargin === 'mid' || product.profitMargin === 'medium') {
    score += 20
  } else if (product.profitMargin === 'low') {
    score += 5
  }

  // 3. 流行品：25分（促进销售）
  if (product.isPopular) {
    score += 25
  }

  // 4. 附加分：同类中的流行品（额外加分）
  if (product.category === currentProduct.category && product.isPopular) {
    score += 10
  }

  return score
}

const getProductId = (p) => p?.id ?? p?._id ?? p?.slug

export default function ProductRecommendations({ currentProductId }) {
  const [allProducts, setAllProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // 读取所有产品
  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true)
      setError('')

      try {
        const res = await fetch('/api/products')

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
          : Array.isArray(data?.items)
            ? data.items
            : Array.isArray(data?.products)
              ? data.products
              : []

        setAllProducts(list)
      } catch (e) {
        setError(e?.message || 'Failed to load products')
        setAllProducts([]) // 出错时清空，避免显示旧数据
      } finally {
        setLoading(false)
      }
    }

    loadProducts()
  }, [])

  const recommendations = useMemo(() => {
    // 1. 找到当前产品
    const currentProduct = allProducts.find(
      (p) => String(getProductId(p)) === String(currentProductId)
    )
    if (!currentProduct) return []

    // 2. 使用权重逻辑计算分数并排序
    const scoredProducts = allProducts
      // 排除当前产品和无变体产品
      .filter(
        (p) =>
          String(getProductId(p)) !== String(currentProductId) &&
          p.variants?.length > 0
      )
      // 计算分数
      .map((product) => ({
        ...product,
        score: calculateProductScore(product, currentProduct),
      }))
      .sort((a, b) => b.score - a.score) // 按分数降序
      .slice(0, 4) // 取前4个

    return scoredProducts
  }, [currentProductId, allProducts])

  // loading
  if (loading) {
    return (
      <div className="rounded border bg-white p-4 text-sm text-gray-600">
        Loading products...
      </div>
    )
  }

  // error
  if (error) {
    return (
      <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error}
      </div>
    )
  }

  // empty products
  if (allProducts.length === 0) return null
  if (recommendations.length === 0) return null

  // recommended products
  return (
    <section className="pt-24 mb-24">
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-800">
          Recommended Products
        </h2>
        {/* <p className="mt-2 text-sm text-gray-600">
          Based on category, profitability, and popularity
        </p> */}
      </div>

      <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4">
        {recommendations.map((product) => (
          <div key={getProductId(product)} className="relative">
            {/* 分数标签（调试用） */}
            {/*
            <div className="absolute -top-2 -right-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white shadow-lg">
              {product.score}
            </div>
            */}

            {/* 产品卡片 */}
            <ProductCard product={product} />

            {/* 推荐原因标签 */}
            {/*
            <div className="mt-2 flex flex-wrap gap-1">
              {product.category === currentProduct?.category && (
                <span className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-800">
                  Same Category
                </span>
              )}
              {product.profitMargin === 'high' && (
                <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-800">
                  High Profit
                </span>
              )}
              {product.isPopular && (
                <span className="rounded-full bg-red-100 px-2 py-1 text-xs text-red-800">
                  Popular
                </span>
              )}
            </div>
            */}
          </div>
        ))}
      </div>

      {/* 权重说明（注释掉） */}
      {/*
      <div className="mt-8 rounded-lg bg-gray-50 p-4">
        <h3 className="text-sm font-medium text-gray-700">Recommendation Criteria:</h3>
        <div className="mt-2 grid grid-cols-3 gap-4 text-xs text-gray-600">
          <div className="space-y-1">
            <div className="font-medium">Same Category: <span className="text-blue-600">40分</span></div>
            <div className="font-medium">High Profit: <span className="text-green-600">35分</span></div>
          </div>
          <div className="space-y-1">
            <div className="font-medium">Popular: <span className="text-red-600">25分</span></div>
            <div className="font-medium">Category+Popular: <span className="text-purple-600">+15分</span></div>
          </div>
          <div className="space-y-1">
            <div className="text-gray-500">Medium Profit: 20分</div>
            <div className="text-gray-500">Low Profit: 5分</div>
          </div>
        </div>
      </div>
      */}
    </section>
  )
}
