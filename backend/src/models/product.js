// models/product.js
const mongoose = require('mongoose')
const { Schema } = mongoose


/**
 * Variant：颜色/款式变体
 * - key: 'black'
 * - label: 'Black'
 * - images: ['/images/.../1.jpg', ...]
 */

const variantSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxLength: 100,
      match: /^[a-z0-9]+(?:[-_][a-z0-9]+)*$/,
    },

    label: {
      type: String,
      required: true,
      trim: true,
      maxLength: 100
    },

    images: {
      type: Schema.Types.Array,
      of: String,
      required: true,
      default: [],
      validate: {
        // v2版本：确保images是字符串数组
        validator: (arr) => Array.isArray(arr) && arr.every((s) => typeof s === 'string'),
        message: 'Images must be an array of strings'
      }
    }
  },
  { _id: false } // 不需要为子文档生成_id
)

/**
 * Specs：规格（展示为主，P0 不做计算）
 *
*/

const specsSchema = new mongoose.Schema(
  {
    maxSize: { type: String, trim: true }, // eg. "56 x 41 x 92 cm "
    foldedSize: { type: String, trim: true },
    cartonSize: { type: String, trim: true },

    pcsPerCarton: { type: Number, min: 0, default: 0 },

    // p0先string表示，后续可改为number做计算
    netWeight: { type: String, trim: true }, // eg. "17.5 kg"
    grossWeight: { type: String, trim: true },
    wheelSize: { type: String, trim: true }, // eg. "90 mm"
    containerLoad: { type: String, trim: true } // eg. "20GP: 1242 pcs \n 40GP: 2574 pcs \n 40HQ: 3018 pcs"
  },

  { _id: false } // 不需要为子文档生成_id
)

// 产品主Schema
const productSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      maxLength: 100,
      index: true, // 为id字段创建索引页面，提升查询性能
      match: /^[a-z0-9]+(?:[-_][a-z0-9]+)*$/,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      maxLength: 100
    },

    // 前台路由/SEO 友好字段 - 可选
    /*
    slug: {
      type: String,
      sparse: true,
      trim: true,
      set: (v) => (v ? v : undefined)
    },
    */


    category: {
      type: String,
      required: true,
      trim: true,
      enum: [
        'shopping-trolley',
        'utility-trolley',
        'camping-wagon',
        'outdoor-furniture'
      ],
      index: true
    },

    // 业务字段
    moq: { type: Number, default: 0, min: 0 },

    // 变体数组 颜色，款式
    variants: { type: [variantSchema], default: [] },

    // 规格
    specs: { type: specsSchema, default: () => ({}) },

    // 推荐部分 (运营字段)
    isPopular: { type: Boolean, default: false, index: true },
    profitMargin: { type: String, enum: ['low', 'mid', 'high'], default: 'mid' },

    // 列表排序：越大越靠前
    sortOrder: { type: Number, default: 0, index: true },

    // 上下架
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true } // 自动添加 createdAt 和 updatedAt 字段
)

// 自定义验证：确保 variants 数组中每个 variant 的 key 唯一
productSchema.path('variants').validate(function (variants) {
  const keys = variants.map(v => v.key)
  return new Set(keys).size === keys.length
}, 'Variant keys must be unique within a product')

/**
 * 附加：列表页常用“主图”可由 variants[0].images[0] 推导
 * 不一定要存字段，避免重复数据。
 */

// 转换输出格式：_id -> id，去掉 __v; 不影响数据库里真实存储的数据
productSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    // mongoId 不和product.id混淆
    returnedObject.mongoId = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
  },
})

/**
 * 组合索引：列表页常见排序
 * - 只看 active
 * - 按 sortOrder 降序、updatedAt 降序
 */
productSchema.index({ isActive: 1, sortOrder: -1, updatedAt: -1 })

module.exports = mongoose.model('Product', productSchema)
