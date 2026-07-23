// src/admin/utils/productModel.test.js
// 后台产品表单的数据规范化：数字字段转字符串（避免受控组件 number/string 混用）、
// features 强制数组、variants 兼容 code/key、images 强制数组、textarea<->数组互转。
import { describe, it, expect } from 'vitest'
import {
  emptyProduct,
  normalizeProductData,
  imagesArrayToTextarea,
  textareaToImagesArray,
} from './productModel'

describe('emptyProduct', () => {
  it('给出安全默认结构，避免 undefined/uncontrolled', () => {
    const p = emptyProduct()
    expect(p.category).toBe('shopping-trolley')
    expect(p.features).toEqual([])
    expect(p.variants).toEqual([])
    expect(p.specs).toHaveProperty('loadCapacity', '')
  })
})

describe('normalizeProductData', () => {
  it('数字字段统一转成字符串（moq/sortOrder/pcsPerCarton）', () => {
    const out = normalizeProductData({ moq: 1000, sortOrder: 5, specs: { pcsPerCarton: 20 } })
    expect(out.moq).toBe('1000')
    expect(out.sortOrder).toBe('5')
    expect(out.specs.pcsPerCarton).toBe('20')
  })

  it('数字字段为 null/undefined → 空字符串', () => {
    const out = normalizeProductData({ moq: null, specs: {} })
    expect(out.moq).toBe('')
    expect(out.specs.pcsPerCarton).toBe('')
  })

  it('features 非数组时强制成空数组', () => {
    expect(normalizeProductData({ features: 'foldable' }).features).toEqual([])
    expect(normalizeProductData({}).features).toEqual([])
    expect(normalizeProductData({ features: ['a'] }).features).toEqual(['a'])
  })

  it('variants 兼容后端 code / key，并保证 images 是数组', () => {
    const out = normalizeProductData({
      variants: [
        { key: 'red', label: 'Red' },              // 老字段 key
        { code: 'blue', label: 'Blue', images: ['b.jpg'] },
        { code: 'green', label: 'Green', images: null },
      ],
    })
    expect(out.variants[0].code).toBe('red')       // key → code 兜底
    expect(out.variants[1].code).toBe('blue')
    expect(out.variants[0].images).toEqual([])     // 缺 images → []
    expect(out.variants[2].images).toEqual([])     // null → []
    expect(out.variants[1].images).toEqual(['b.jpg'])
  })

  it('merge 时保留 base 默认（缺省的 specs 字段仍在）', () => {
    const out = normalizeProductData({ name: 'X' })
    expect(out.name).toBe('X')
    expect(out.specs).toHaveProperty('material', '')
  })
})

describe('images textarea <-> array 互转', () => {
  it('数组 → 每行一个 URL', () => {
    expect(imagesArrayToTextarea(['a.jpg', 'b.jpg'])).toBe('a.jpg\nb.jpg')
    expect(imagesArrayToTextarea(null)).toBe('')
  })

  it('textarea → 数组：去每行空白、过滤空行', () => {
    expect(textareaToImagesArray(' a.jpg \n\n  b.jpg \n')).toEqual(['a.jpg', 'b.jpg'])
    expect(textareaToImagesArray('')).toEqual([])
    expect(textareaToImagesArray(null)).toEqual([])
  })

  it('互转往返稳定（round-trip）', () => {
    const arr = ['x/1.png', 'y/2.png']
    expect(textareaToImagesArray(imagesArrayToTextarea(arr))).toEqual(arr)
  })
})
