// src/admin/components/product/ProductForm.jsx
import React from 'react'
import VariantImageUploader from './ImageUploader'

const ENABLE_MANUAL_URL =
  import.meta.env.VITE_ENABLE_MANUAL_IMAGE_URL === 'true'

export default function ProductForm({
  product,
  setField,
  setSpecsField,

  updateVariantField,
  addVariant,
  removeVariant,

  CATEGORY_OPTIONS,
  PROFIT_OPTIONS,

  imagesArrayToTextarea,
  textareaToImagesArray,
  isCreateMode = false,

  onVariantImageRemove,
  runCloudTask,
}) {
  return (
    <>
      {/* ===== Basic Fields ===== */}
      <div className="border rounded p-4 space-y-4">
        <div className="font-semibold">基本信息 Basic</div>
        <div className="text-sm text-gray-500">所有属性必填，必选</div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {isCreateMode ? (
            <label className="space-y-1">
              <div className="text-sm text-gray-700">
                Product ID (产品ID - 英文，小写，不能有空格） 创建后不可更改
              </div>
              <input
                className="w-full border rounded p-2 text-sm"
                value={product.id ?? ''}
                onChange={(e) => {
                  // 强制小写 + 去掉空格 + 强制英文字母数字（避免后续路由/查询大小写问题）
                  const v = e.target.value
                    .toLowerCase()
                    .replace(/[^a-z0-9-_]/g, '')

                  setField('id', v)
                }}
                placeholder="e.g. jx-l5"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
              />
            </label>
          ) : null}

          <label className="space-y-1">
            <div className="text-sm text-gray-700">Name 产品名字</div>
            <input
              className="w-full border rounded p-2 text-sm"
              value={product.name ?? ''}
              onChange={(e) => setField('name', e.target.value)}
              placeholder="e.g. JX-L5"
            />
          </label>

          {/* <label className="space-y-1">
            <div className="text-sm text-gray-700">Slug</div>
            <input
              className="w-full border rounded p-2 text-sm"
              value={product.slug}
              onChange={(e) => setField('slug', e.target.value)}
              placeholder="e.g. jx-l5"
            />
          </label> */}

          <label className="space-y-1">
            <div className="text-sm text-gray-700">Category 产品种类</div>
            <select
              className="w-full border rounded p-2 text-sm"
              value={product.category ?? ''}
              onChange={(e) => setField('category', e.target.value)}
            >
              <option value="" disabled>
                -- Select category --
              </option>
              {CATEGORY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1">
            <div className="text-sm text-gray-700">MOQ 最小起订量</div>
            <input
              className="w-full border rounded p-2 text-sm"
              type="number"
              onWheel={(e) => e.target.blur()}
              inputMode="numeric"
              min="0"
              value={product.moq ?? ''}
              onChange={(e) => setField('moq', e.target.value)}
            />
          </label>

          <label className="space-y-1">
            <div className="text-sm text-gray-700">
              Sort Order (数值越大，产品展示优先级越高，可用于首页或重点推荐展示)
            </div>
            <input
              className="w-full border rounded p-2 text-sm"
              type="number"
              onWheel={(e) => e.target.blur()}
              inputMode="numeric"
              min="0"
              value={product.sortOrder ?? ''}
              onChange={(e) => setField('sortOrder', e.target.value)}
            />
          </label>

          <label className="space-y-1">
            <div className="text-sm text-gray-700">Profit Margin (利润率)</div>
            <select
              className="w-full border rounded p-2 text-sm"
              value={product.profitMargin ?? 'mid'}
              onChange={(e) => setField('profitMargin', e.target.value)}
            >
              {PROFIT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>

          <div className="flex flex-wrap md:flex-nowrap items-center gap-6">
            <label className="flex items-center gap-2 whitespace-nowrap">
              <input
                type="checkbox"
                checked={!!product.isActive}
                onChange={(e) => setField('isActive', e.target.checked)}
              />
              <span className="text-sm text-gray-700">Active (上架)</span>
            </label>

            <label className="flex items-center gap-2 whitespace-nowrap">
              <input
                type="checkbox"
                checked={!!product.isPopular}
                onChange={(e) => setField('isPopular', e.target.checked)}
              />
              <span className="text-sm text-gray-700">Popular (爆款)</span>
            </label>
          </div>
        </div>
      </div>

      {/* ===== Specs ===== */}
      <div className="border rounded p-4 space-y-4">
        <div className="font-semibold">详情信息 Specs</div>
        <div className="text-sm text-gray-500 space-y-1">
          <div>
            请根据产品实际适用属性填写，非所有字段均为必填;
            例如：户外家具类产品无需填写 wheelSize。
          </div>
          <div>
            填写完成后，请前往前台产品展示页面检查展示效果与排版是否正常。
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="space-y-1">
            <div className="text-sm text-gray-700">Max Size 最大尺寸</div>
            <input
              className="w-full border rounded p-2 text-sm"
              value={product.specs?.maxSize || ''}
              onChange={(e) => setSpecsField('maxSize', e.target.value)}
              placeholder='e.g. "56 x 41 x 92 cm"'
            />
          </label>

          <label className="space-y-1">
            <div className="text-sm text-gray-700">Folded Size 折叠尺寸</div>
            <input
              className="w-full border rounded p-2 text-sm"
              value={product.specs?.foldedSize || ''}
              onChange={(e) => setSpecsField('foldedSize', e.target.value)}
              placeholder='e.g. "62.5 x 42.5 x 15 cm"'
            />
          </label>

          <label className="space-y-1">
            <div className="text-sm text-gray-700">Carton Size 纸箱尺寸</div>
            <input
              className="w-full border rounded p-2 text-sm"
              value={product.specs?.cartonSize || ''}
              onChange={(e) => setSpecsField('cartonSize', e.target.value)}
              placeholder='e.g. "65 x 43.5 x 25.5 cm"'
            />
          </label>

          <label className="space-y-1">
            <div className="text-sm text-gray-700">
              PCS / Carton (纸箱包装量)
            </div>
            <input
              className="w-full border rounded p-2 text-sm"
              type="number"
              onWheel={(e) => e.target.blur()}
              inputMode="numeric"
              min="0"
              value={product.specs?.pcsPerCarton ?? ''}
              onChange={(e) => setSpecsField('pcsPerCarton', e.target.value)}
            />
          </label>

          <label className="space-y-1">
            <div className="text-sm text-gray-700">Net Weight 净重</div>
            <input
              className="w-full border rounded p-2 text-sm"
              value={product.specs?.netWeight || ''}
              onChange={(e) => setSpecsField('netWeight', e.target.value)}
              placeholder='e.g. "17.5 kg"'
            />
          </label>

          <label className="space-y-1">
            <div className="text-sm text-gray-700">Gross Weight 毛重</div>
            <input
              className="w-full border rounded p-2 text-sm"
              value={product.specs?.grossWeight || ''}
              onChange={(e) => setSpecsField('grossWeight', e.target.value)}
              placeholder='e.g. "16 kg"'
            />
          </label>

          <label className="space-y-1">
            <div className="text-sm text-gray-700">Wheel Size (轮子尺寸)</div>
            <input
              className="w-full border rounded p-2 text-sm"
              value={product.specs?.wheelSize || ''}
              onChange={(e) => setSpecsField('wheelSize', e.target.value)}
              placeholder='e.g. "90 mm"'
            />
          </label>

          <label className="space-y-1 md:col-span-2">
            <div className="text-sm text-gray-700">Container Load 集装箱</div>
            <textarea
              className="w-full border rounded p-2 text-sm min-h-[120px]"
              value={product.specs?.containerLoad || ''}
              onChange={(e) => setSpecsField('containerLoad', e.target.value)}
              placeholder={
                '20GP: 1242 pcs\n40GP: 2574 pcs\n40HQ: 3018 pcs\n注意分行和空格'
              }
            />
          </label>
        </div>
      </div>

      {/* ===== Variants ===== */}
      <div className="border rounded p-4 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="font-semibold">颜色/种类 Variants</div>
            <div className="text-xs text-gray-500 mt-1">
              系统规则：默认使用第一个种类的第一张图片作为产品主图
            </div>
            <div className="text-xs text-gray-500 mt-1">
              注意：每个 Variant 的 Key 不能重复，否则保存时会报错
            </div>
          </div>

          <button
            className="text-sm px-3 py-2 rounded border border-gray-300 hover:bg-gray-50 whitespace-nowrap shrink-0"
            onClick={addVariant}
            type="button"
          >
            + 增加 种类/颜色
          </button>
        </div>

        {(product.variants || []).length === 0 ? (
          <div className="text-sm text-gray-500">暂时无种类及图片</div>
        ) : null}

        <div className="space-y-4">
          {(product.variants || []).map((v, idx) => (
            <div key={v.id || idx} className="border rounded p-3 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-medium">
                  Variant 种类 #{idx + 1}
                </div>
                <button
                  className="text-xs px-2 py-1 rounded border border-red-500 text-red-600 hover:bg-red-50"
                  onClick={() => removeVariant(idx)}
                  type="button"
                >
                  删除种类
                </button>
              </div>
              <div className="text-sm text-gray-500">所有属性必填，必选</div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label className="space-y-1">
                  <div className="text-sm text-gray-700">Key 英文 小写 无空格</div>
                  <input
                    className="w-full border rounded p-2 text-sm"
                    value={v.code || ''}
                    onChange={(e) => {
                      const v2 = e.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9-_]/g, '')
                      updateVariantField(idx, { code: v2 })
                    }}
                    placeholder="e.g. rose_pink"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                  />
                </label>

                <label className="space-y-1">
                  <div className="text-sm text-gray-700">Label 显示标注</div>
                  <input
                    className="w-full border rounded p-2 text-sm"
                    value={v.label || ''}
                    onChange={(e) =>
                      updateVariantField(idx, { label: e.target.value })
                    }
                    placeholder="e.g. Rose Pink"
                  />
                </label>

                <div className="space-y-2 md:col-span-2">
                  <div className="text-sm text-gray-700">图片 Images</div>

                  {/* ✅ 上传器：追加写入 v.images */}
                  <VariantImageUploader
                    images={Array.isArray(v.images) ? v.images : []}
                    onChange={(nextImages) =>
                      updateVariantField(idx, { images: nextImages })
                    }
                    onRemove={(imageIndex) => onVariantImageRemove?.(idx, imageIndex)}
                    runCloudTask={runCloudTask}

                  />

                  {/* ✅ 仍然保留 textarea：单独URL占一行（手工编辑） */}
                  {ENABLE_MANUAL_URL && <div className="mt-2">
                    <div className="text-sm text-gray-700 mb-1">图片 URL（单独URL占一行，可手动编辑）</div>
                    <textarea
                      className="w-full border rounded p-2 text-sm min-h-[110px] resize-y"
                      value={imagesArrayToTextarea(v.images)}
                      onChange={(e) =>
                        updateVariantField(idx, {
                          images: textareaToImagesArray(e.target.value),
                        })
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') e.stopPropagation()
                      }}
                      placeholder={'https://.../1.jpg\nhttps://.../2.jpg'}
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      图片数量: {Array.isArray(v.images) ? v.images.length : 0}
                    </div>
                  </div>}
                </div>

              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
