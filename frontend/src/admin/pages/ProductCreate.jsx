// src/admin/pages/ProductCreate.jsx
import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminFetch } from '../../services/adminApi'
import { deleteAdminImageOSSByUrl } from '../../services/adminUploads'


import ProductForm from '../components/ProductForm'
import BusyOverlay from '../components/BusyOverlay'

import useCloudBusyQueue from '../hooks/useCloudBusyQueue'

import {
  emptyProduct,
  imagesArrayToTextarea,
  textareaToImagesArray,
} from '../utils/productModel'

const CATEGORY_OPTIONS = [
  { value: 'shopping-trolley', label: 'Shopping Trolley' },
  { value: 'utility-trolley', label: 'Utility Trolley' },
  { value: 'camping-wagon', label: 'Camping Wagon' },
  { value: 'outdoor-furniture', label: 'Outdoor Furniture' },
]

const PROFIT_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'mid', label: 'Mid' },
  { value: 'high', label: 'High' },
]

// 主体函数
export default function ProductCreate() {
  const navigate = useNavigate()

  const [saving, setSaving] = useState(false) // 保存中状态
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  // Create：默认空产品
  const [product, setProduct] = useState(() => emptyProduct())

  // 是否有修改（脏数据）
  const [isDirty, setIsDirty] = useState(false)

  // firstRender, 避免初始加载时触发脏数据


  // ===== 脏数据保护逻辑 =====
  const initialRef = useRef(JSON.stringify(emptyProduct()))

  useEffect(() => {
    setIsDirty(JSON.stringify(product) !== initialRef.current)
  }, [product])

  // 离开页面前的提示（脏数据保护）
  useEffect(() => {
    const handler = (e) => {
      if (!isDirty) return
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [isDirty])

  // 云端忙碌队列 Hook
  const { busy, _isBusy, runCloudTask } = useCloudBusyQueue({
    onError: (msg) => setError(msg),
  })


  // ===== 辅助函数：更新字段 =====
  const setField = (key, value) => {
    setProduct((prev) => ({ ...prev, [key]: value }))
  }

  const setSpecsField = (key, value) => {
    setProduct((prev) => ({
      ...prev,
      specs: { ...(prev.specs || {}), [key]: value },
    }))
  }

  // ===== variants的操作 =====
  // index: 想要改的第几个variant, patch: { key: value } 想要改的字段和值
  const updateVariantField = (index, patch) => {
    setProduct((prev) => {
      // Array.isArray 确保 prev.variants 是数组， 如果不是，先创建一个空数组
      const newVariants = Array.isArray(prev.variants) ? [...prev.variants] : []
      // 更新指定 index 的 variant，合并 patch
      newVariants[index] = { ...(newVariants[index] || {}), ...patch }
      return { ...prev, variants: newVariants }
    })
  }

  const addVariant = () => {
    setProduct((prev) => ({
      ...prev,
      variants: [
        ...(Array.isArray(prev.variants) ? prev.variants : []),
        { code: '', label: '', images: [] },
      ],
    }))
  }

  // create 模式下删除 variant：只删本地 state，顺便删 OSS 图片，默认variant未保存后端 数据库
  const removeVariant = async (index) => {
    const variant = product.variants?.[index]
    if (!variant) return

    const urls = Array.isArray(variant.images) ? variant.images : []

    // 1) ✅ UI 先删（永远成功）
    setProduct((prev) => {
      const next = [...(prev.variants || [])]
      next.splice(index, 1)
      return { ...prev, variants: next }
    })

    // 2) ✅ OSS 后台尽力删：失败不阻塞 UI
    await runCloudTask('云端删除该变体图片中，请耐心等候 ☁️', async () => {
      const failed = []
      for (const url of urls) {
        try {
          await deleteAdminImageOSSByUrl(url)
        } catch (e) {
          console.warn('[oss delete] failed:', url, e)
          failed.push(url)
        }
      }

      // 可选：给用户一个“部分失败”的提示（不要 throw，不然又卡住 UI）
      if (failed.length > 0) {
        // 你可以用 setError / setNotice / toast
        setError(`已从界面移除，但有 ${failed.length} 张图片云端删除失败，稍后会自动清理`)
        console.warn('[oss delete] failed urls:', failed)
      }
    })
  }

  // 删除 variant 图片（create 模式下只删 OSS 和本地 state）
  const handleVariantImageRemove = async (variantIndex, imageIndex) => {
    const url = product.variants?.[variantIndex]?.images?.[imageIndex]
    if (!url) return

    // 1) ✅ UI 先删（用户永远感觉“删掉了”）
    setProduct(prev => {
      const variants = [...(prev.variants || [])]
      const v = variants[variantIndex]
      if (!v) return prev
      const images = [...(v.images || [])]
      images.splice(imageIndex, 1)
      variants[variantIndex] = { ...v, images }
      return { ...prev, variants }
    })

    // 2) ✅ OSS best-effort：失败也不影响 UI
    await runCloudTask('云端删除图片中，请耐心等候 ☁️', async () => {
      try {
        await deleteAdminImageOSSByUrl(url)
      } catch (e) {
        // 失败就记日志 + 顶部提示（可选）
        console.warn('[oss delete] failed, leave orphan:', url, e)
        // 可选：你想让用户知道就 setError，但不要挡住 UI
        setError('图片云端删除失败，已从界面移除，稍后会自动清理')
      }
    })
  }

  // ===== 辅助函数：保存前验证，拦截脏数据 =====
  const validateBeforeSave = () => {
    if (!product.id?.trim()) return 'Product id 必须填写'
    if (!product.name?.trim()) return 'Product name 必须填写'
    // if (!product.slug?.trim()) return 'Product slug 必须填写'
    if (!product.category?.trim()) return 'Category 必须选择'

    for (let i = 0; i < (product.variants || []).length; i++) {
      const v = product.variants[i]
      if (!v.code?.trim()) return `变体颜色 #${i + 1}: key 必须填写`
      if (!v.label?.trim()) return `变体颜色 #${i + 1}: label 必须填写`
      if (!Array.isArray(v.images) || !v.images.every((s) => typeof s === 'string')) {
        return `变体颜色 #${i + 1}: images 必须是图片 URL 数组`
        // 后续文件上传改这里
      }
    }
    return ''
  }

  // 辅助函数：转换为整数或 null
  const toIntOrNull = (v) => {
    if (v === null || v === undefined) return null
    const s = String(v).trim()
    if (s === '') return null
    if (!/^\d+$/.test(s)) return null   // 只允许整数（moq/pcsPerCarton 应该是整数）
    return Number(s)
  }

  // ===== Create：POST 新建产品 =====
  const onSave = async () => {
    setError('')
    setNotice('')

    const msg = validateBeforeSave()
    if (msg) {
      setError(msg)
      return
    }

    setSaving(true)
    try {
      const idNormalized = String(product.id || '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9-_]/g, '')

      const payload = {
        id: idNormalized,
        name: String(product.name || '').trim(),

        // 如果你现在不打算用 slug：最好别传，避免 null/'' 触发 unique
        // ...(product.slug && String(product.slug).trim()
        //   ? { slug: String(product.slug).trim() }
        //   : {}),

        category: product.category,

        moq: toIntOrNull(product.moq),
        sortOrder: toIntOrNull(product.sortOrder) ?? 0,

        isActive: !!product.isActive,
        isPopular: !!product.isPopular,
        profitMargin: product.profitMargin || 'mid',

        specs: {
          ...(product.specs || {}),
          pcsPerCarton: toIntOrNull(product.specs?.pcsPerCarton) ?? 0,
        },

        variants: (product.variants || []).map((v) => ({
          key: String(v.code || '')
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9-_]/g, ''),

          label: String(v.label || '').trim(),

          images: Array.isArray(v.images)
            ? v.images
              .map((s) => String(s || '').trim())
              .filter(Boolean) // 去掉空行
            : [],
        })),
      }

      // ✅ Create: POST
      await adminFetch('/api/products/admin', {
        method: 'POST',
        body: payload,
      })

      setNotice('产品创建成功 🎉')

      // 脏数据清零
      setIsDirty(false)

      // 成功后有三种策略（先默认最常用：回列表）
      navigate('/admin/products')
    } catch (e) {
      if (e?.status === 409) {
        // 👉 业务冲突：重复 id / slug
        const field = e?.data?.field
        const value = e?.data?.value

        if (field === 'id') {
          setError(`产品 ID 已存在：${value}`)
        // } else if (field === 'slug') {
        //   setError(`Slug 已存在，请更换`)
        } else {
          setError('产品标识已存在，请检查 ID / Slug')
        }

        return
      }
      const msg2 = e?.message ? `${e.message} - 保存产品失败` : '保存产品失败'
      setError(msg2)

    } finally {
      setSaving(false)
    }
  }

  // 返回列表的辅助函数（带脏数据保护）
  const goBackToList = () => {
    if (isDirty && !window.confirm('当前有未保存修改，确定离开吗？')) return
    navigate('/admin/products')
  }

  return (
    <div className="p-6 space-y-6">
      <BusyOverlay open={busy.open} text={busy.text} />
      {/* ===== Header ===== */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">上架新产品</h1>
        </div>

        <div className="flex gap-2">
          <button
            className="text-sm px-3 py-2 rounded border hover:bg-gray-50"
            onClick={goBackToList}
            type="button"
          >
							返回产品列表
          </button>

          <button
            className={`text-sm px-3 py-2 rounded border ${
              saving
                ? 'opacity-60 cursor-not-allowed'
                : 'hover:bg-blue-50 border-blue-500 text-blue-600'
            }`}
            onClick={onSave}
            disabled={saving}
            type="button"
          >
            {saving ? '创建中...' : '创建产品'}
          </button>
        </div>
      </div>

      {/* ===== Alerts ===== */}
      {error ? (
        <div className="border border-red-200 bg-red-50 text-red-700 p-3 rounded text-sm">
          {error}
        </div>
      ) : null}

      {notice ? (
        <div className="border border-green-200 bg-green-50 text-green-700 p-3 rounded text-sm">
          {notice}
        </div>
      ) : null}

      {/* ===== Form Body (复用) ===== */}
      <ProductForm
        product={product}
        setField={setField}
        setSpecsField={setSpecsField}
        updateVariantField={updateVariantField}
        addVariant={addVariant}
        removeVariant={removeVariant}
        CATEGORY_OPTIONS={CATEGORY_OPTIONS}
        PROFIT_OPTIONS={PROFIT_OPTIONS}
        imagesArrayToTextarea={imagesArrayToTextarea}
        textareaToImagesArray={textareaToImagesArray}
        isCreateMode = {true}
        onVariantImageRemove={handleVariantImageRemove}
        runCloudTask={runCloudTask}
      />

      {/* bottom action */}
      <div className="flex gap-2">
        <button
          className="text-sm px-3 py-2 rounded border hover:bg-gray-50"
          onClick={goBackToList}
          type="button"
        >
						返回产品列表
        </button>

        <button
          className={`text-sm px-3 py-2 rounded border ${
            saving
              ? 'opacity-60 cursor-not-allowed'
              : 'hover:bg-blue-50 border-blue-500 text-blue-600'
          }`}
          onClick={onSave}
          disabled={saving}
          type="button"
        >
          {saving ? '创建中...' : '创建产品'}
        </button>

      </div>
      {/* ===== Alerts ===== */}
      {error ? (
        <div className="border border-red-200 bg-red-50 text-red-700 p-3 rounded text-sm">
          {error}
        </div>
      ) : null}

      {notice ? (
        <div className="border border-green-200 bg-green-50 text-green-700 p-3 rounded text-sm">
          {notice}
        </div>
      ) : null}
    </div>
  )
}




