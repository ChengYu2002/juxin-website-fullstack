// src/context/ImageRegionContext.jsx
// 访客地区探测（每会话一次）→ 提供 useImg() 改写图片 host，实现"图片双链路"。
//
// 探测手段：Cloudflare 边缘的 /cdn-cgi/trace 返回 loc=XX（访客国家）。
// - 本地/无 Cloudflare 环境：该端点返回的不是 trace 文本 → 解析不到 loc → 当作海外（走现状 CDN）。
// - 请求失败/超时/非 CN → 一律 'OW'，保持现状 CDN，**绝不比现在更差**。
// - 结果缓存到 sessionStorage，同会话内不重复探测、且切页无闪烁。

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { rewriteImageHost } from '../utils/imageHost'

const KEY = 'juxin_region'
const ImageRegionContext = createContext({ region: 'OW', img: (u) => u })

function readCached() {
  try {
    return sessionStorage.getItem(KEY) || null
  } catch {
    return null
  }
}

export function ImageRegionProvider({ children }) {
  const [region, setRegion] = useState(() => readCached() || 'OW')

  useEffect(() => {
    if (readCached()) return // 本会话已探测过

    let done = false
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 1500)

    fetch('/cdn-cgi/trace', { signal: ctrl.signal })
      .then((r) => (r.ok ? r.text() : ''))
      .then((txt) => {
        if (done) return
        const m = /(?:^|\n)loc=([A-Z]{2})/.exec(txt)
        const r = m && m[1] === 'CN' ? 'CN' : 'OW'
        try {
          sessionStorage.setItem(KEY, r)
        } catch {
          /* ignore */
        }
        setRegion(r)
      })
      .catch(() => {
        /* 失败=保持 OW，安全兜底 */
      })
      .finally(() => clearTimeout(timer))

    return () => {
      done = true
      ctrl.abort()
      clearTimeout(timer)
    }
  }, [])

  const img = useCallback((u) => rewriteImageHost(u, region), [region])

  return (
    <ImageRegionContext.Provider value={{ region, img }}>
      {children}
    </ImageRegionContext.Provider>
  )
}

// 返回改写函数 (url) => url'。CN 访客把 CDN 图换成国内 OSS，其余原样。
export function useImg() {
  return useContext(ImageRegionContext).img
}
