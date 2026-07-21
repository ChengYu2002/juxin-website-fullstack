// src/admin/pages/ProductEdit.jsx
import { useEffect, useMemo, useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { adminFetch } from '../../services/adminApi'
import { deleteAdminImageOSSByUrl } from '../../services/adminUploads'

import ProductForm from '../components/ProductForm'
import BusyOverlay from '../components/BusyOverlay'

// ⭐ 新增：和 Create 一样的云端任务队列 hook
import useCloudBusyQueue from '../hooks/useCloudBusyQueue'

import {
  emptyProduct,
  normalizeProductData,
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
export default function ProductEdit() {
  const { id } = useParams()
  const productId = id.toLowerCase()

  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false) // 保存中状态
  const [error, setError] = useState('')
  const [loadError, setLoadError] = useState('')
  const [notice, setNotice] = useState('')

  const [product, setProduct] = useState(() => emptyProduct())

  const pageTitle = useMemo(() => {
    return `${product?.name ? `编辑: ${product.name}` : '编辑产品'} —— 产品id: ${productId}`
  }, [product?.name, productId] )

  // 是否有修改（脏数据）
  const [isDirty, setIsDirty] = useState(false)

  // ⭐ 新增：和 Create 一样的 busy 队列（串行 + 全屏遮罩）
  const { busy, runCloudTask } = useCloudBusyQueue({
    // 注意：这里用 setError 是“非阻塞提示”，不会阻止 UI 更新
    onError: (msg) => {
      // 不要清掉 loadError，只负责展示云端操作的错误即可
      setError(msg || '云端操作失败')
    },
  })

  // ===== 加载，拉取产品数据 =====
  useEffect(() => {
    let cancelled = false // 防止用户快速切换页面导致的状态更新问题

    async function load() {
      setLoading(true)
      setError('')
      setNotice('')

      try {
        // 1) 优先走 admin GET（如果你还没实现会失败）
        const p1 = await adminFetch(`/api/products/admin/${productId}`)
        if (!cancelled) {
          // 只有在组件还“活着”的时候，才允许更新状态
          setProduct(normalizeProductData(p1))
        }
      } catch {
        try {
          // 2) fallback 走 public GET /:id 或 /:slug
          const p2 = await adminFetch(`/api/products/${encodeURIComponent(productId)}`)
          if (!cancelled) setProduct(normalizeProductData(p2))
        } catch (e2) {
          if (!cancelled) {
            const msg = e2?.message ? `${e2.message} - 加载产品失败 (请检查 产品id 是否正确 或 重新登录)` : '加载产品失败 (请检查 产品id 是否正确 或 重新登录)'
            setLoadError(msg)
          }
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    // ⭐ 也可以把加载包到 busy 里（更统一），但不强制
    // 这里我不改变你现有 loading UI 逻辑，保持原样
    load()

    return () => {
      cancelled = true
    } // 清理函数，组件卸载时设置 cancelled 为 true
  }, [productId])


  // ===== 脏数据保护逻辑 =====
  const initialRef = useRef(null)
  // 把初始快照存下来
  useEffect(() => {
    // 在 load 成功、setProduct 之后，把快照定下来
    if (!loading && !loadError && initialRef.current === null) {
      // 把当前 product 的 JSON 字符串存为初始快照
      initialRef.current = JSON.stringify(product)
      setIsDirty(false)
    }
  }, [loading, loadError, product])

  useEffect(() => {
    if (!initialRef.current) return
    setIsDirty(JSON.stringify(product) !== initialRef.current)
    // 比较当前 product 和初始快照的 JSON 字符串是否相同
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
        {
          code: '',
          label: '',
          images: [],
          _isNew: true,  // 前端临时标记：表示该 variant 尚未保存到后端，仅存在本地 state
        },
      ],
    }))
  }

  const removeVariant = async (index) => {
    const variant = product.variants?.[index]
    if (!variant) return

    // ⭐ 用 busy 包住（和 Create 一致：云端操作期间禁止交互）
    await runCloudTask('云端删除该变体中，请耐心等候 ☁️', async () => {
      try {
        // ✅ A) 未保存 variant：按 URL 清理 OSS（如果有），不删 DB
        if (variant._isNew) {
          const urls = Array.isArray(variant.images) ? variant.images : []

          // 删除 OSS 图片
          for (const url of urls) {
            try {
              await deleteAdminImageOSSByUrl(url)
            } catch (err) {
              console.warn('delete temp image failed:', err?.message)
              setError(`云端删除图片失败（已从界面移除）：${err?.message || 'unknown error'}`)
            }
          }

        } else {
          if (!product?.id) throw new Error('Missing product.id')
          if (!variant?.key) throw new Error('Missing variant.key')
          // ✅ B) 已保存：交给后端删 DB + OSS
          await adminFetch(
            `/api/products/admin/${product.id}/variants/${variant.key}`,
            { method: 'DELETE' }
          )
        }

        // 删除前端 state 里的 variant
        setProduct((prev) => {
          const next = [...(prev.variants || [])]
          next.splice(index, 1)
          return { ...prev, variants: next }
        })

      } catch(err){
        alert('删除种类失败：' + err.message)
        setError(`删除种类失败：${err?.message || 'unknown error'}`)
      }
    })
  }

  // 单张图片删除
  const handleVariantImageRemove = async (variantIndex, imageIndex) => {
    // ① 从当前 product 拿 variant + url（别在 setProduct 里 await）
    const variant = product.variants?.[variantIndex]
    const url = variant?.images?.[imageIndex]
    if (!variant || !url) {
      return
    }

    // ⭐ 用 busy 包住：这属于云端操作
    await runCloudTask('云端删除图片中，请耐心等候', async () => {
      // ② 先调用后端/OSS 删除（失败就不改 UI，避免假删除）
      // ⚠️ 你要求“逻辑别动 + OSS 错误 UI 可以删除”，所以这里我不改你的结构：
      //    仍然是 try/catch 后继续执行第③步 setProduct（UI 会删）
      try {
        if (variant._isNew) {
          // 草稿 variant：只删 OSS（best-effort，但我建议失败就别改 UI）

          await deleteAdminImageOSSByUrl(url)
          console.log('[edit] delete oss image success')

        } else {
          // 已保存：走后端（DB pull + OSS best-effort，幂等）

          await adminFetch(
            `/api/products/admin/${product.id}/variants/${variant.key}/images?url=${encodeURIComponent(
              url
            )}`,
            { method: 'DELETE' }
          )
          console.log('[edit] delete image via backend success')
        }
      } catch (e) {
        console.warn('[edit] delete image failed:', e)
        setError(`云端删除图片失败（已从界面移除）：${e?.message || 'unknown error'}`)
      }

      // ③ 删除成功后，再同步更新本地 state（纯同步）
      setProduct((prev) => {
        const variants = [...(prev.variants || [])]
        const v = variants[variantIndex]
        if (!v) return prev

        const images = [...(v.images || [])]
        if (!images[imageIndex]) return prev

        images.splice(imageIndex, 1)
        variants[variantIndex] = { ...v, images }
        return { ...prev, variants }
      })
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

  // ===== 保存产品 =====
  const onSave = async () => {
    setError('')
    setNotice('')

    // 验证，报错
    const msg = validateBeforeSave()
    if (msg) {
      setError(msg)
      return
    }

    setSaving(true)

    // ⭐ 保存属于云端操作：加 busy（和 Create 一致）
    await runCloudTask('云端保存产品中，请耐心等候', async () => {
      try {
        // 后续如果数据结构变化，这里也要改
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

          features: Array.isArray(product.features) ? product.features : [],

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

        await adminFetch(`/api/products/admin/${id}`, {
          method: 'PUT',
          body: payload,
        })

        // 保存成功后，把当前状态作为新的“初始快照”
        initialRef.current = JSON.stringify(product)
        setIsDirty(false)

        setNotice('产品保存成功 🎉')

        setTimeout(() => {
          setNotice('')
        }, 3000)
        // 如果你想保存后回列表： navigate('/admin/products')
      } catch (e) {
        console.log('SAVE ERROR raw:', e)
        console.log('SAVE ERROR msg:', e?.message)
        console.log('SAVE ERROR status:', e?.status)
        console.log('SAVE ERROR body:', e?.body || e?.data)

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
        } else {
          const msg2 = e?.message ? `${e.message} - 保存产品失败` : '保存产品失败'
          setError(msg2)
        }
      } finally {
        setSaving(false)
      }
    })
  }

  // 返回列表的辅助函数（带脏数据保护）
  const goBackToList = () => {
    if (isDirty && !window.confirm('当前有未保存修改，确定离开吗？')) return
    navigate('/admin/products')
  }

  // ===== 注意：渲染必须在组件顶层 return，不要写进 onSave 里！=====
  if (loading) {
    return (
      <div className="p-6">
        <div className="text-sm text-gray-600">Loading...</div>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="p-6 space-y-4">
        <div className="border border-red-200 bg-red-50 text-red-700 p-3 rounded text-sm">
          {loadError}
        </div>
        <button
          className="text-sm px-3 py-2 rounded border hover:bg-gray-50"
          onClick={() => navigate('/admin/products')}
          type="button"
        >
          返回产品列表
        </button>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <BusyOverlay open={busy.open} text={busy.text || '云端操作中，请耐心等候 ☁️'} />

      {/* ===== Header ===== */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">{pageTitle}</h1>
          <div className="text-s text-gray-500 mt-1">
            mongoId: {product.mongoId || '-'} · 产品更新于:{' '}
            {product.updatedAt ? new Date(product.updatedAt).toLocaleString() : '-'}
          </div>
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
            {saving ? '保存中...' : '保存产品'}
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

      {/* ===== Form Body (拆出来的) ===== */}
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
          {saving ? '保存中...' : '保存产品'}
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
