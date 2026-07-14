// src/admin/utils/productModel.js

// 生成一个安全的默认产品结构，避免 uncontrolled/undefined
export function emptyProduct() {
  return {
    id: '',
    name: '',
    // slug: '',
    category: 'shopping-trolley',
    moq: 0,
    sortOrder: 0,
    isActive: true,
    isPopular: false,
    profitMargin: 'mid',
    specs: {
      maxSize: '',
      foldedSize: '',
      cartonSize: '',
      pcsPerCarton: 0,
      netWeight: '',
      grossWeight: '',
      wheelSize: '',
      containerLoad: '',
    },
    variants: [],
    mongoId: '',
    createdAt: '',
    updatedAt: '',
  }
}

// 规范化后端返回的产品数据，确保字段完整且类型正确（给表单用）
export function normalizeProductData(p) {
  const base = emptyProduct()

  // 小工具：把“表单里的数字字段”统一转成 string（允许空）
  const toNumberString = (v) => {
    if (v === null || v === undefined) return ''
    // 后端可能已经是 number，也可能是 "12" 这种 string
    const s = String(v).trim()
    return s === '' ? '' : s
  }

  const merged = {
    ...base,
    ...p,

    specs: {
      ...base.specs,
      ...(p?.specs || {}),

      // ✅ 表单数字字段：转字符串，避免 number/string 混用
      pcsPerCarton: toNumberString(p?.specs?.pcsPerCarton),
    },

    // ✅ 表单数字字段：转字符串
    moq: toNumberString(p?.moq),
    sortOrder: toNumberString(p?.sortOrder),

    variants: Array.isArray(p?.variants)
      ? p.variants.map((v) => ({
        ...v,
        // 兼容后端 key / code
        code: v?.code ?? v?.key ?? '',
        // ✅ 确保 images 一定是数组
        images: Array.isArray(v?.images) ? v.images : [],
      }))
      : [],
  }

  return merged
}


// variants 图片 ：textarea <-> string[] 的转换函数
// 目前是images url数组，未来可能会改成 file upload，这里记得改
export function imagesArrayToTextarea(images) {
  if (!Array.isArray(images)) return ''
  return images.join('\n')
}

export function textareaToImagesArray(text) {
  // 这里宽松点：任何输入都转成 string，再 split
  return String(text || '')
    .split('\n') // 按行拆分
    .map((line) => line.trim()) // 去除每行首尾空白
    .filter(Boolean) // 过滤空行，falsey 值，比如 空字符串
}

