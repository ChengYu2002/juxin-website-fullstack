// controllers/productController.js
// 作用：处理 product 的业务逻辑：返回结果、数据操作、CRUD。
const Product = require('../models/product')
const { deleteBatchByUrls } = require('./uploadController')
const { listPublic, getPublicByIdOrSlug } = require('../services/productService')

/**
 * =========================
 * PUBLIC
 * =========================
 */

// public：只返回上架产品
// GET /api/products?category=shopping-trolley
const getPublicProducts = async (req, res, next) => {
  try {
    const products = await listPublic({ category: req.query.category })
    res.json(products)
  } catch (error) {
    next(error)
  }
}


// public：按 id 或 slug 获取单个产品 (下架商品不允许看到)
// GET /api/products/:idorSlug
const getPublicProductByIdorSlug = async (req, res, next) => {
  try {
    // 下架产品视为不存在，统一 404（逻辑收敛到 productService）
    const product = await getPublicByIdOrSlug(req.params.idorSlug)
    if (!product) {
      return res.status(404).json({ ok: false, error: 'Product not found' })
    }
    res.json(product)
  } catch (error) {
    next(error)
  }
}

/**
 * =========================
 * ADMIN
 * =========================
 */

// admin：返回所有产品（可选过滤）
// GET /api/products/admin?category=...&isActive=true/false
const getAdminProducts = async (req, res, next) => {
  try {
    const { category, isActive } = req.query
    const filter = {}

    if (typeof isActive !== 'undefined') {  // 确认 isActive 这个变量“真的存在”
      filter.isActive = isActive === 'true' // string转换为bool (防御式编程)
    }

    if (category) {
      filter.category = category
    }

    const products = await Product.find(filter)
      .sort({ sortOrder: -1, updatedAt: -1 })

    res.json(products)
  } catch (error) {
    next(error)
  }
}

// admin：按 id 或 slug 获取单个产品 (所有商品都能看到)
// GET /api/products/admin/:idorSlug (admin only)
const getAmdinProductByIdorSlug = async (req, res, next) => {
  try {
    // 从 URL 参数中获取 id 或 slug, {}: 解构赋值重命名
    const { idorSlug }  = req.params

    // 先按业务 id 查（JX-25ZP）
    let product = await Product.findOne({ id: idorSlug })
    // 如果没找到，再按 slug 查（jx-25zp）
    if (!product) {
      product = await Product.findOne({ slug: idorSlug })
    }
    // 仍然没找到，返回 404
    if (!product) {
      return res.status(404).json({ ok: false, error: 'Product not found' })
    }

    res.json(product)
  } catch (error) {
    next(error)
  }
}

// 新建产品（管理员用）
// POST /api/products (admin only)
const createProduct = async (req, res, next) => {
  try {
    const productData = req.body
    const created = await Product.create(productData)
    res.status(201).json(created)

  } catch (error) {
    // slug/id unique 冲突常见：E11000 duplicate key
    if (error?.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0]
      const value = error.keyValue?.[field]

      return res.status(409).json({
        ok: false,
        field,
        value,
        error: `${field} already exists`
      })
    }

    next(error)
  }
}

// 更新产品（管理员用）（⚠️ 使用业务 id）
// PUT /api/products/:id (admin only)
const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params
    const body = req.body

    const updated = await Product.findOneAndUpdate(
      { id }, // 查询条件：业务 id（JX-L5）
      body,   // 更新内容
      { new: true, runValidators: true } // 选项：返回更新后的文档，运行验证
    )

    if (!updated) {
      return res.status(404).json({ ok: false, error: 'Product not found' })
    }
    res.json(updated)
  } catch (error) {
    // slug/id unique 冲突常见：E11000 duplicate key
    if (error && error.code === 11000) {
      return res.status(409).json({ ok: false, error: 'Product id or slug already exists' })
    }

    next(error)
  }
}

// admin：删除产品（⚠️ 使用业务 id）
// DELETE /api/products/:id
const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params

    // ① 先查 product（不能直接 delete，不然图片 key 丢了）
    const product = await Product.findOne({ id })

    if (!product) {
      return res.status(404).json({ ok: false, error: 'Product not found' })
    }

    // set: 去重图片 URL
    const urlSet = new Set()
    for (const variant of product.variants || []) {
      for (const imgUrl of variant.images || []) {
        const u = (imgUrl && String(imgUrl).trim()) || ''
        if (u) urlSet.add(u)
      }
    }

    const urls = [...urlSet]


    // ✅ OSS best-effort：失败不 throw
    if (urls.length > 0) {
      try {
        await deleteBatchByUrls(urls)
      } catch (err) {
        // 这里不要 next(err)
        // 只记录日志（用你自己的 logger）
        console.warn('[deleteProduct] deleteBatchByUrls failed:', err?.message || err)
      }
    }

    // ✅ 再删 DB
    await product.deleteOne()

    res.status(204).end()
  } catch (error) {
    next(error)
  }
}

// admin：删除产品variant（⚠️ 使用业务 variant key）
// DELETE /products/admin/:id/variants/:key
const deleteProductVariant = async (req, res, next) => {
  try {
    const { id, key } = req.params
    const keyNorm = String(key || '').trim().toLowerCase()

    const product = await Product.findOne({ id })
    if (!product) return res.status(404).json({ ok: false, error: 'Product not found' })

    const variants = Array.isArray(product.variants) ? product.variants : []
    const idx = variants.findIndex(
      (v) => String(v.key || '').trim().toLowerCase() === keyNorm
    )
    if (idx === -1) return (res.status(404).json({ ok: false, error: 'Variant not found' }))

    const variant = variants[idx]

    // cleanup 统计给前端（可观测性更强）
    let cleanup = { ok: 0, notFound: 0, skipped: 0, failed: 0 }

    if (Array.isArray(variant.images) && variant.images.length > 0) {
      try {
        const r = await deleteBatchByUrls(variant.images)
        cleanup = {
          ok: r.ok?.length || 0,
          notFound: r.notFound?.length || 0,
          skipped: r.skipped?.length || 0,
          failed: r.failed?.length || 0,
        }
        console.log('[deleteVariant] cleanup summary', { id, key: keyNorm, ...cleanup })
      } catch (e) {
        console.warn('[deleteVariant] deleteBatchByUrls failed', { id, key: keyNorm, msg: e?.message })
      }
    }

    variants.splice(idx, 1)
    product.variants = variants
    await product.save()

    return res.json({ ok: true, cleanup })
  } catch (err) {
    next(err)
  }
}

// admin：删除产品 variant 图片（⚠️ 使用业务 variant key）
// DELETE /products/admin/:id/variants/:key/images?url=...
const deleteVariantImage = async (req, res, next) => {
  const productId = req.params.id
  const variantKey = req.params.key

  const url = String(req.query.url || '').trim()
  if (!url) {
    return res.status(400).json({ ok: false, error: 'Missing image URL' })
  }

  try {
    // ✅ 1) DB：永远先删引用（幂等）: 无论variantKey存不存在，都尝试删图片引用
    const r = await Product.updateOne(
      { id: productId, 'variants.key': variantKey },
      { $pull: { 'variants.$.images': url } }
    )

    // ✅ 2) OSS：best-effort 删除（不存在也算成功）
    const del = await deleteBatchByUrls([url])

    // 🔴 只对 BadUrl / Forbidden / Invalid key 这种输入错误报 400
    // const hasClientError = del.failed?.some(x =>
    //   x.code === 'BadUrl' ||
    //   /Invalid url|Forbidden host|Invalid key/i.test(x.msg || '')
    // )

    // if (hasClientError) {
    //   return res.status(400).json({
    //     ok: false,
    //     error: 'Invalid image url',
    //     storage: del,
    //   })
    // }

    // ✅ 3) 返回 OK（不因为 OSS 不存在而失败）
    return res.json({
      ok: true,
      db: { matched: r.matchedCount, modified: r.modifiedCount },
      storage: del,
    })

  } catch (error) {
    next(error)

  }
}


module.exports = {
  getPublicProducts,
  getPublicProductByIdorSlug,
  getAdminProducts,
  getAmdinProductByIdorSlug,
  createProduct,
  updateProduct,
  deleteProduct,
  deleteProductVariant,
  deleteVariantImage,
}