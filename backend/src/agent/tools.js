// src/agent/tools.js
// Jason 的产品库工具（P2，只读）。直接调 productService，不走 HTTP。
// 返回内容做「瘦身」：只给模型答规格需要的字段，去掉图片/时间戳等噪音，省 token、少幻觉。

const { tool } = require('@langchain/core/tools')
const { z } = require('zod')
const { listPublic, getPublicByIdOrSlug } = require('../services/productService')

const CATEGORIES = ['shopping-trolley', 'utility-trolley', 'camping-wagon', 'outdoor-furniture']

// 单个产品瘦身：规格全给（这些正是要答的真值），颜色只给名字，丢掉 images/时间戳
function trimProduct(d) {
  const s = d.specs || {}
  return {
    id: d.id,
    name: d.name,
    category: d.category,
    path: `/products/${d.id}`, // 产品页链接，供助理原样附上（不靠模型自己拼）
    moq: d.moq,
    colors: (d.variants || []).map((v) => v.label),
    specs: {
      maxSize: s.maxSize,
      foldedSize: s.foldedSize,
      cartonSize: s.cartonSize,
      pcsPerCarton: s.pcsPerCarton, // 每箱装箱量
      netWeight: s.netWeight,
      grossWeight: s.grossWeight,
      wheelSize: s.wheelSize,
      containerLoad: s.containerLoad, // 集装箱装载 20GP/40GP/40HQ
    },
  }
}

const searchProducts = tool(
  async ({ category, keyword, color }) => {
    const docs = await listPublic({ category, keyword, color })
    // 列表保持轻量：只给 id/名称/分类/MOQ/颜色数，详细规格让模型再调 getProduct
    // 列表给"识别产品"字段 + MOQ。MOQ 近乎常量（多为 1000），放列表里安全，
    // 且能一次答"所有 MOQ 是多少"这类聚合问题，不必逐个 getProduct。
    // 但颜色数/尺寸/装箱等"变化较大"的数字仍不放列表（防张冠李戴），只从 getProduct 单取。
    const list = docs.map((d) => ({
      id: d.id,
      name: d.name,
      category: d.category,
      path: `/products/${d.id}`,
      moq: d.moq,
      isPopular: !!d.isPopular, // 真实热销标记；只有它为 true 才能说"热销"
    }))
    // 列表已按排名权重（sortOrder）从高到低排序，靠前=更该推荐
    return JSON.stringify({ count: list.length, items: list })
  },
  {
    name: 'searchProducts',
    description:
      '按分类、关键词和/或颜色搜索巨鑫的上架产品，返回产品列表（型号id、名称、分类、链接、是否热销、MOQ）。' +
      '结果已按排名权重从高到低排序——推荐时优先取靠前的。' +
      '列表含 MOQ，可直接用于回答"MOQ 是多少/最小起订量"等问题（含"所有产品的 MOQ"这类聚合问题，一次调用即可，不要逐个 getProduct）。' +
      '但颜色、尺寸、装箱量等其它规格不在列表里，需要时再用 getProduct 按型号单取，不要臆断这些数字。',
    schema: z.object({
      category: z.enum(CATEGORIES).optional().describe('产品分类，可选'),
      keyword: z.string().optional().describe('按型号或名称模糊搜索的关键词，可选'),
      color: z
        .string()
        .optional()
        .describe(
          '按颜色筛选，返回有该颜色的产品。用**英文小写**颜色词，如 red/blue/black/white/green；' +
            '买家说中文颜色（红色/蓝色/黑色）时，先自行翻译成英文再传。不区分大小写匹配颜色名。',
        ),
    }),
  },
)

const getProduct = tool(
  async ({ idOrSlug }) => {
    const d = await getPublicByIdOrSlug(String(idOrSlug || '').trim().toLowerCase())
    if (!d) return JSON.stringify({ found: false })
    return JSON.stringify({ found: true, product: trimProduct(d) })
  },
  {
    name: 'getProduct',
    description:
      '按产品型号（如 JX-160SP）获取单个产品的完整规格：MOQ、每箱装箱量(pcsPerCarton)、集装箱装载(containerLoad)、' +
      '尺寸(maxSize/foldedSize/cartonSize)、重量、轮径、颜色变体等。' +
      '凡回答规格/MOQ/装箱量/尺寸/重量等具体数值，必须先调用它取真值，禁止凭空作答。',
    schema: z.object({
      idOrSlug: z.string().describe('产品型号 id，如 JX-160SP 或 jx-160sp'),
    }),
  },
)

const tools = [searchProducts, getProduct]

module.exports = { tools, searchProducts, getProduct, trimProduct }
