// src/utils/imageHost.test.js
// rewriteImageHost：仅当访客在中国大陆(region==='CN') 且 URL 属于海外 CDN 时，
// 才把 <img> 源换成杭州 OSS 直连；其余一律原样返回（安全兜底）。
import { describe, it, expect } from 'vitest'
import { rewriteImageHost, CDN_HOST, OSS_CN_HOST } from './imageHost'

describe('rewriteImageHost', () => {
  const cdnUrl = `${CDN_HOST}/products/jx-160sp/red_1.png`

  it('CN + CDN 链接 → 改写成 OSS 源站，路径保持不变', () => {
    expect(rewriteImageHost(cdnUrl, 'CN')).toBe(`${OSS_CN_HOST}/products/jx-160sp/red_1.png`)
  })

  it('海外访客(OW) → 原样返回，不改写', () => {
    expect(rewriteImageHost(cdnUrl, 'OW')).toBe(cdnUrl)
    expect(rewriteImageHost(cdnUrl, undefined)).toBe(cdnUrl)
  })

  it('CN 但非 CDN 域名 → 原样返回（不误伤第三方图）', () => {
    const other = 'https://example.com/a.png'
    expect(rewriteImageHost(other, 'CN')).toBe(other)
  })

  it('CDN 域名但不是以 host + "/" 开头 → 不改写（避免前缀误匹配）', () => {
    const tricky = `${CDN_HOST}.evil.com/a.png`
    expect(rewriteImageHost(tricky, 'CN')).toBe(tricky)
  })

  it('非字符串输入 → 安全兜底原样返回', () => {
    expect(rewriteImageHost(null, 'CN')).toBe(null)
    expect(rewriteImageHost(undefined, 'CN')).toBe(undefined)
    expect(rewriteImageHost(123, 'CN')).toBe(123)
  })
})
