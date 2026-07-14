// src/services/adminUploads.js
import { adminFetch } from './adminApi.js'

// files
export async function uploadAdminImages(files) {
  // 创建一个用于上传文件的表单数据对象
  const formData = new FormData()
  for (const file of files) {
    // 将每个文件添加到表单数据中，字段名为 'images'
    formData.append('images', file)
  }

  return adminFetch('/api/admin/uploads/images', {
    method: 'POST',
    body: formData, // 直接把 FormData 对象作为请求体发送, 不必要设置 Content-Type，浏览器会自动处理
  })
}

// oss删除单个图片
export async function deleteAdminImageOSSByUrl(imageUrl) {
  const url = String(imageUrl || '').trim()
  if (!url) throw new Error('Missing imageUrl')

  return adminFetch(
    `/api/admin/uploads/images?url=${encodeURIComponent(url)}`,
    { method: 'DELETE' }
  )
}