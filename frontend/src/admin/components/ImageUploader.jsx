// src/admin/components/ImageUploader.jsx
import { useState, useRef } from 'react'
import { uploadAdminImages } from '../../services/adminUploads.js'

const MAX_FILES_PER_PICK = 5
const MAX_FILES = 10
const MAX_SIZE_MB = 10
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

function uniqKeepOrder(arr) {
  const seen = new Set()
  const out = []

  for (const item of arr) {
    let i = String(item || '').trim() // 防止 item 是 null/undefined
    // 跳过空字符串
    if (!i) continue
    // 去重
    if (!seen.has(i)) {
      seen.add(i)
      out.push(i) // ✅ 用 i（trim 后的值），避免 out 里保留脏空格
    }
  }
  return out
}

export default function VariantImageUploader({
  images = [],
  onChange,
  onRemove,
  disabled = false, // 父组件可以控制禁用（比如整个表单提交中禁用所有输入）

  // ⭐ 新增：可选，父组件传入（来自 useCloudBusyQueue）
  // 目的：用全局 BusyOverlay + 串行队列包住上传
  runCloudTask,
  cloudText = '云端上传图片中，请耐心等候 ☁️',
}) {
  // 上传中就要禁用按钮、改文案（Uploading...)
  const [action, setAction] = useState(null)
  const busy = action !== null

  const [error, setError] = useState('')
  const fileRef = useRef(null) // ✅ 更稳：用 ref 手动触发文件选择框

  const handlePick = async (e) => {
    // 确保事件处理只针对文件输入

    setError('')
    const files = Array.from(e.target.files || []) //Array.from: 将类数组对象转换为真正的数组
    e.target.value = '' // 重置输入，允许选同一文件多次
    if (files.length === 0) return // 用户取消选择，没有文件

    // ✅ 单次选择数量限制（与后端 array('images', 10) 一致）
    if (files.length > MAX_FILES_PER_PICK) {
      setError(`单次最多选择 ${MAX_FILES_PER_PICK} 张图片`)
      return
    }

    // 验证文件数量, files是这次选的， image 是已有的
    if (files.length + images.length > MAX_FILES) {
      setError(`该种类最多 ${MAX_FILES} 张（当前 ${images.length} 张）`)
      return
    }

    // 验证每个文件大小和类型
    for (const file of files) {
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        setError(`文件 ${file.name} 太大，不能超过 ${MAX_SIZE_MB} MB`)
        return
      }
      if (!ALLOWED_TYPES.has(file.type)) {
        setError(`不支持的格式: ${file.type || 'unknown'}（仅 jpg/png/webp）`)
        return
      }
    }

    // ⭐ 把真正上传逻辑抽成函数（方便给 runCloudTask 包装）
    const doUpload = async () => {
      const res = await uploadAdminImages(files)

      const newUrls = (res.items || [])
        .map((item) => item?.url)
        .filter(Boolean)

      const allImages = uniqKeepOrder([...(images || []), ...newUrls])

      onChange?.(allImages)
    }

    // 上传
    try {
      // ⭐⭐⭐ 新增：如果父组件传了 runCloudTask → 用全局 BusyOverlay（串行队列）
      if (typeof runCloudTask === 'function') {
        await runCloudTask(cloudText, doUpload)
      } else {
        // ✅ fallback：保持你原来的本地 busy 逻辑（完全兼容）
        setAction('upload') // 开始上传，进入 busy 状态
        await doUpload()
      }
    } catch (err) {
      const base = (err?.message && String(err.message).trim()) || ''
      const msg = base ? `${base} - 上传图片失败` : '上传图片失败'
      setError(msg)
    } finally {
      setAction(null)
    }
  }

  // 判断是否是已上传到 OSS 的图片 URL
  // function isOssUploadedUrl(url) {
  //   try {
  //     const u = new URL(url, window.location.origin)
  //     return u.pathname.startsWith('/products/')
  //   } catch {
  //     return false
  //   }
  // }

  // ✅ 删除：只通知父级
  const removeAt = (index) => {
    if (!onRemove) return
    onRemove(index)
  }

  // 删除图片
  // const removeAt = async(index) => {
  //   const url = images[index]
  //   if (!url) return
  //
  //   const next = images.slice()
  //   next.splice(index, 1)
  //
  //   try {
  //     setError('')
  //     setAction('delete')
  //
  //     // if (isOssUploadedUrl(url)) {
  //
  //     //   await deleteAdminImageByUrl(url)
  //     // }
  //
  //     onChange?.(next)
  //   }
  //   catch(err) {
  //     const base = (err?.message && String(err.message).trim()) || ''
  //     const msg = base ? `${base} - 删除图片失败` : '删除图片失败'
  //     setError(msg)
  //
  //   } finally {
  //     setAction(null)
  //   }
  // }

  const moveUp = (index) => {
    if (index <= 0) return
    const next = images.slice()
    ;[next[index - 1], next[index]] = [next[index], next[index - 1]]
    onChange?.(next)
  }

  const moveDown = (index) => {
    if (index >= images.length - 1) return
    const next = images.slice()
    ;[next[index], next[index + 1]] = [next[index + 1], next[index]]
    onChange?.(next)
  }

  const setAsCover = (index) => {
    if (index <= 0) return
    const next = images.slice()
    const [picked] = next.splice(index, 1)
    next.unshift(picked)
    onChange?.(next)
  }

  // ✅ 仍然沿用你原来的禁用逻辑
  // 注意：如果父组件有全屏 BusyOverlay，UI 会被挡住；这里的禁用更多是“语义正确”
  const canPick = !disabled && !busy && images.length < MAX_FILES
  const canEdit = !disabled && !busy

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 flex-wrap">
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={handlePick}
          disabled={!canPick}
          className="hidden"
        />

        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={!canPick}
          className={[
            '!inline-flex !w-fit !flex-none !shrink-0 items-center',
            'px-3 py-2 rounded border text-sm select-none',
            'border-blue-300 text-blue-700 hover:bg-blue-50 hover:border-blue-400',
            canPick ? 'cursor-pointer' : 'opacity-60 cursor-not-allowed',
          ].join(' ')}
        >
          {action === 'upload' ? '正在上传… 请耐心等待' : '上传图片'}
        </button>

        <div className="text-xs text-gray-500">
          支持 jpg/png/webp · 单张 ≤ {MAX_SIZE_MB}MB · 单次最多 {MAX_FILES_PER_PICK} 张 · 本种类最多 {MAX_FILES} 张
        </div>

        <div className="text-xs text-gray-500">
          当前：{Array.isArray(images) ? images.length : 0} 张
        </div>
      </div>

      {error ? <div className="text-sm text-red-600">{error}</div> : null}

      {Array.isArray(images) && images.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {images.map((url, idx) => (
            <div key={`${url}-${idx}`} className="border rounded overflow-hidden">
              <div className="aspect-square bg-gray-50">
                <img src={url} alt="" className="w-full h-full object-cover" />
              </div>

              <div className="p-2 text-[11px] text-gray-500 break-all">
                {url}
              </div>

              <div className="border-t p-2 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  {idx === 0 ? (
                    <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">
                      主图
                    </span>
                  ) : (
                    <span className="text-[11px] text-gray-400">#{idx + 1}</span>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setAsCover(idx)}
                    disabled={!canEdit || idx === 0}
                    className={[
                      'rounded-md px-2 py-1 text-[11px] border',
                      (!canEdit || idx === 0)
                        ? 'opacity-40 cursor-not-allowed'
                        : 'border-blue-200 text-blue-700 hover:bg-blue-50',
                    ].join(' ')}
                  >
                    设为主图
                  </button>

                  <button
                    type="button"
                    onClick={() => moveUp(idx)}
                    disabled={!canEdit || idx === 0}
                    className={[
                      'rounded-md px-2 py-1 text-[11px] border border-gray-200 text-gray-700',
                      (!canEdit || idx === 0)
                        ? 'opacity-40 cursor-not-allowed'
                        : 'hover:bg-gray-50',
                    ].join(' ')}
                  >
                    上移
                  </button>

                  <button
                    type="button"
                    onClick={() => moveDown(idx)}
                    disabled={!canEdit || idx === images.length - 1}
                    className={[
                      'rounded-md px-2 py-1 text-[11px] border border-gray-200 text-gray-700',
                      (!canEdit || idx === images.length - 1)
                        ? 'opacity-40 cursor-not-allowed'
                        : 'hover:bg-gray-50',
                    ].join(' ')}
                    title="下移一位"
                  >
                    下移
                  </button>

                  <button
                    type="button"
                    onClick={() => removeAt(idx)}
                    disabled={!canEdit}
                    className={[
                      'rounded-md px-2 py-1 text-[11px] border border-red-200 text-red-700',
                      !canEdit ? 'opacity-40 cursor-not-allowed' : 'hover:bg-red-50',
                    ].join(' ')}
                  >
                    {action === 'delete' ? '正在删除…' : '删除'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-sm text-gray-500">还没有上传图片</div>
      )}
    </div>
  )
}
