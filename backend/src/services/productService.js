// src/services/productService.js
// 产品查询的单一数据源：controller（HTTP）和 agent 工具（P2）都调这里，
// 避免工具再走一圈 HTTP。只封"读"，写操作仍在 controller。

const Product = require('../models/product')

function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * public 列表：只返回上架产品。
 * @param {object} opts
 * @param {string} [opts.category] - 分类精确过滤（shopping-trolley 等）
 * @param {string} [opts.keyword]  - 模糊搜（对 name / 业务 id 做不区分大小写正则）
 * @returns {Promise<Array>} Mongoose 文档数组（排序同原列表接口）
 */
async function listPublic({ category, keyword, color } = {}) {
  const filter = { isActive: true }
  if (category) filter.category = category
  if (keyword) {
    const rx = new RegExp(escapeRegex(keyword), 'i')
    filter.$or = [{ name: rx }, { id: rx }]
  }
  // 按颜色：对变体颜色名(variant.label)做不区分大小写的子串匹配
  // 'red'→'Red'、'blue'→'Royal Blue' 都能命中
  if (color) filter['variants.label'] = new RegExp(escapeRegex(color), 'i')
  return Product.find(filter).sort({ sortOrder: -1, createdAt: -1 })
}

/**
 * public 单个：先按业务 id 查，再按 slug 查；下架产品视为不存在。
 * @param {string} idorSlug
 * @returns {Promise<object|null>} 命中返回文档，否则 null（由调用方决定 404/提示）
 */
async function getPublicByIdOrSlug(idorSlug) {
  if (!idorSlug) return null
  let product = await Product.findOne({ id: idorSlug })
  if (!product) product = await Product.findOne({ slug: idorSlug })
  if (!product || !product.isActive) return null
  return product
}

module.exports = { listPublic, getPublicByIdOrSlug }
