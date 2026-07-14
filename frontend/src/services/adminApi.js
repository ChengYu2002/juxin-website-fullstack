// src/services/adminApi.js
import { getAdminToken, clearAdminToken } from '../admin/auth.js'

export async function adminFetch(url, options = {}) {
  const token = getAdminToken()

  const headers = new Headers(options.headers || {})

  // ✅ token
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const body = options.body
  const isFormData =
    typeof FormData !== 'undefined' && body instanceof FormData

  // ✅ 只有在“非 FormData”且 body 是普通对象时，才当 JSON
  let finalBody = body
  const isPlainObject =
    body &&
    typeof body === 'object' &&
    !isFormData &&
    !(body instanceof Blob) &&
    !(body instanceof ArrayBuffer)

  if (isPlainObject) {
    headers.set('Content-Type', 'application/json')
    finalBody = JSON.stringify(body) // 转换为 JSON 字符串
  }

  // ✅ FormData：千万别手动设置 Content-Type（让浏览器自动带 boundary）
  if (isFormData) {
    headers.delete('Content-Type')
  } else {
    // 如果调用方没传 Content-Type 且也不是 JSON，我们就不强行加
    // （保持兼容，比如未来上传 Blob 等）
    // 你原来是强行加 JSON，这里改掉
  }

  const res = await fetch(url, {
    ...options,
    method: options.method || 'GET',
    headers,
    body: finalBody,
  })

  const data = await res.json().catch(() => ({}))

  // // ✅ 统一处理鉴权失败：自动跳登录页
  if (res.status === 401 || res.status === 403) {
    clearAdminToken()
    window.location.href = '/admin/login'
    return
  }

  if (!res.ok) {
    const err = new Error(
      data?.error ||
        data?.message ||
        (typeof data === 'string' && data) ||
        res.statusText ||
        'Request failed'
    )
    err.status = res.status
    err.data = data
    throw err
  }

  return data
}
