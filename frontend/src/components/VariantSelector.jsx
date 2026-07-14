// src/components/VariantSelector.jsx
export default function VariantSelector({
  variants = [],
  selectedIndex = 0,
  onChange,
}) {
  {/* 避免了 length=0 时 % 0 这种危险情况 */}
  if (variants.length <= 1) return null

  return (
    <div className="mb-6">
      <h3 className="mb-2 text-lg font-medium">Color Variants</h3>
      <div className="flex flex-wrap gap-2">
        {variants.map((variant, index) => (
          <button
            key={variant.key}
            onClick={() => onChange(index)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              selectedIndex === index
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            {/* map 生成按钮
                点击按钮更新 selectedVariantIndex 并重置图片 index
                用 selectedVariantIndex === index 控制样式：
                  选中：蓝底白字
                   未选中：灰底灰字 + hover */}

            {variant.label}
          </button>
        ))}
      </div>
    </div>
  )
}
