// src/pages/Product.jsx
import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'

import VariantSelector from '../components/VariantSelector'
import ProductGallery from '../components/ProductGallery'
import ProductActions from '../components/ProductActions'
import ProductSpecs from '../components/ProductSpecs'
import ProductRecommendations from '../components/ProductRecommendations'

import Seo from '../components/Seo'
import JsonLd from '../components/JsonLd'

function ProductDetail({ product }) {
  // 初始化状态，选择第一个变体和第一张图片
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0)
  // 当前选中第几个颜色变体

  const variants = product?.variants ?? []

  // 获取当前选中的变体
  const selectedVariant = product?.variants?.[selectedVariantIndex]

  // SEO 用:主图 + 去重图片列表
  const mainImage = product?.variants?.[0]?.images?.[0]
  const productImages = (product?.variants || [])
    .flatMap((v) => v?.images || [])
    .filter(Boolean)
    .slice(0, 6)

  // 初始化: 打开页面永远滚动到顶部
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [])

  return (
    <main className="mx-auto max-w-4xl px-5 py-8">
      <Seo
        title={product.name}
        description={`${product.name} — ${product.category} by Juxin Manufacturing. MOQ ${product.moq} pcs. Specifications, export packing and OEM/ODM options for wholesale buyers.`}
        path={`/products/${String(product.id).toLowerCase()}`}
        image={mainImage}
        type="product"
      />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: product.name,
          sku: product.id,
          category: product.category,
          ...(productImages.length ? { image: productImages } : {}),
          description: `${product.name} — ${product.category}, MOQ ${product.moq} pcs, manufactured by Juxin Manufacturing.`,
          brand: { '@type': 'Brand', name: 'Juxin' },
        }}
      />
      {/* 上半部分：两栏 */}
      <div className="grid gap-10 lg:grid-cols-5">
        {/* 左：图片区 */}
        <section className="lg:col-span-3">
          <div className="mb-5">
            {/* 避免了 length=0 时 % 0 这种危险情况 */}
            <VariantSelector
              variants={variants}
              selectedIndex={selectedVariantIndex}
              onChange={setSelectedVariantIndex}
            />
          </div>

          {/* 主图片区域 如果没有images则传空数组*/ }
          <ProductGallery
            key={`${product.id}-${selectedVariantIndex}`}
            images={selectedVariant?.images || []}
          />
        </section>

        {/* 右：信息区 */}
        <aside className="lg:col-span-2 lg:sticky lg:top-6 self-start">
          <h1 className="text-4xl font-semibold tracking-wide">{product.name}</h1>

          {/* 产品信息 */}
          {product.moq > 0 && (
            <div className="mt-3 text-lg text-gray-800">
              <span className="font-medium">MOQ:</span> {product.moq} pcs
            </div>
          )}
          <div className="mt-3 text-lg text-gray-800">
            <span className="font-medium">Color:</span> {selectedVariant?.label}
          </div>

          <ProductActions product={product} selectedVariant={selectedVariant} />

          {/* 规格信息 */}
          <ProductSpecs specs={product.specs} moq={product.moq} />
        </aside>
      </div>

      {/* 推荐产品部分 */}
      <ProductRecommendations currentProductId={product.id} />
    </main>
  )
}

export default function Product() {
  const { id } = useParams()
  const productId = String(id || '').trim().toLowerCase()
  // const product = products.find((p) => p.id === id)

  const [product, setProduct] = useState(null)
  // const [allProducts, setAllProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // 反正产品抖动
  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        // 单个产品数据加载
        const res = await fetch(`/api/products/${encodeURIComponent(productId)}`)
        if (!res.ok) {
          let msg = 'Failed to load product'
          try {
            const errData = await res.json()
            msg = errData?.message || msg
          } catch {
            // ignore
          }
          throw new Error(msg)
        }
        const data = await res.json()
        setProduct(data)
      } catch (e) {
        setError(e?.message || 'Failed to load product')
      } finally {
        setLoading(false)
      }
    }
    load()

  }, [productId])

  // 加载状态
  if (loading) {
    return (
      <main className="mx-auto max-w-4xl px-5 py-8">
        <div className="rounded border bg-white p-4 text-sm text-gray-600">
          Loading product...
        </div>
      </main>
    )
  }

  // 错误状态
  if (error) {
    return (
      <main className="mx-auto max-w-4xl px-5 py-8">
        <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      </main>
    )
  }

  // 未找到产品
  if (!product) {
    return (
      <main className="mx-auto max-w-4xl px-5 py-8">
        <h2 className="text-lg font-semibold">Product not found</h2>
      </main>
    )
  }

  // 当切换产品时重置变体：
  // ✅ 用 key 触发组件重挂载，从而让 selectedVariantIndex 回到初始值 0
  return <ProductDetail key={id} product={product} />
}
