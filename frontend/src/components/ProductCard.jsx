// src/components/ProductCard.jsx
import { Link } from 'react-router-dom'

export default function ProductCard({ product }) {
  const variants = Array.isArray(product?.variants) ? product.variants : []
  const mainImage = variants?.[0]?.images?.[0]

  // ✅ 1 variant = 1 color
  const colorCount = variants.length
  const extraColors = Math.max(0, colorCount - 1)

  return (
    <Link

      to={`/products/${product.id.toLowerCase()}`}
      className="group block rounded-xl border border-slate-200 bg-white
                 p-3 sm:p-4
                 transition hover:-translate-y-0.5 hover:shadow-md"
    >
      {/* 图片容器：手机端更紧 */}
      <div
        className="mb-3 sm:mb-4
                  flex h-64 sm:h-72 w-full items-center justify-center
                  overflow-hidden rounded-lg bg-white"
      >
        {mainImage ? (
          <img
            src={mainImage}
            alt={product.name}
            className="max-h-full max-w-full object-contain
                      p-1.5 sm:p-2
                      transition-transform duration-300
                      group-hover:scale-[1.06]"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center
                          text-gray-400 text-sm select-none">
            <svg
              className="mb-2 h-10 w-10 text-gray-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3 5h18M3 5v14a2 2 0 002 2h14a2 2 0 002-2V5M8 13l3-3 4 4M8 17h8"
              />
            </svg>
            <span>No Image</span>
          </div>
        )}
      </div>


      {/* 产品名称 */}
      <div className="text-center">
        <h3 className="text-sm font-semibold tracking-wide text-slate-800">
          {product.name}
        </h3>

        {/* ✅ 颜色提示：极轻、不抢 */}
        <p
          className={`mt-1 text-xs text-slate-500 ${
            extraColors > 0 ? 'visible' : 'invisible'
          }`}
        >
          +{extraColors} more {extraColors === 1 ? 'color' : 'colors'}
        </p>

        {/* 极轻强调线 */}
        <div
          className="mx-auto mt-1.5 sm:mt-2
                     h-0.5 w-10 rounded-full
                     bg-slate-300 opacity-0
                     transition-opacity duration-300
                     group-hover:opacity-100"
        />
      </div>
    </Link>
  )
}
