// tests/tools.test.js
// trimProduct：给模型的产品「瘦身」——空规格字段整条剔除（防模型看到空值瞎补），
// 颜色只留 label，附产品页 path，features 空则不给。
const { trimProduct } = require('../src/agent/tools')

const fullDoc = {
  id: 'JX-160SP',
  name: '购物手推车 160SP',
  category: 'shopping-trolley',
  moq: 1000,
  specs: {
    maxSize: '40x30x95cm',
    foldedSize: '',        // 空 → 应被剔除
    pcsPerCarton: 0,       // 数字 0 视为未填 → 应被剔除
    loadCapacity: '30kg',
    material: null,        // null → 应被剔除
  },
  variants: [
    { label: 'Red', images: ['a.jpg'] },
    { label: 'Royal Blue' },
  ],
  features: ['foldable', 'brake'],
  createdAt: '2026-01-01',  // 噪音字段，不应出现在输出
}

describe('trimProduct', () => {
  it('只保留识别字段 + path，丢掉时间戳等噪音', () => {
    const out = trimProduct(fullDoc)
    expect(out).toMatchObject({
      id: 'JX-160SP',
      name: '购物手推车 160SP',
      category: 'shopping-trolley',
      moq: 1000,
      path: '/products/JX-160SP',
    })
    expect(out).not.toHaveProperty('createdAt')
    expect(out).not.toHaveProperty('variants')
  })

  it('colors 只取 variant.label', () => {
    expect(trimProduct(fullDoc).colors).toEqual(['Red', 'Royal Blue'])
  })

  it('specs 只保留「填过」的字段，空串/0/null 全剔除', () => {
    const { specs } = trimProduct(fullDoc)
    expect(specs).toEqual({ maxSize: '40x30x95cm', loadCapacity: '30kg' })
    expect(specs).not.toHaveProperty('foldedSize')
    expect(specs).not.toHaveProperty('pcsPerCarton')
    expect(specs).not.toHaveProperty('material')
  })

  it('features 有值才给，空数组则整个不出现', () => {
    expect(trimProduct(fullDoc).features).toEqual(['foldable', 'brake'])
    const noFeat = trimProduct({ ...fullDoc, features: [] })
    expect(noFeat).not.toHaveProperty('features')
  })

  it('所有 specs 都为空时，输出不含 specs', () => {
    const bare = trimProduct({ id: 'X', name: 'x', category: 'c', moq: 1, specs: {}, variants: [] })
    expect(bare).not.toHaveProperty('specs')
    expect(bare.colors).toEqual([])
  })
})
