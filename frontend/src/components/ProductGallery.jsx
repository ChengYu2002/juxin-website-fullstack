// src/components/ProductGallery.jsx
import { useRef, useState } from 'react'
import Lightbox from 'yet-another-react-lightbox'
import 'yet-another-react-lightbox/styles.css'
import { useImg } from '../context/ImageRegionContext'

/**
 * ProductGallery
 * - 桌面端：hover 局部放大（放大镜）
 * - 移动端：左右滑切图（swipe）+ 点击打开大图（Lightbox）
 * - 支持左右切换、圆点指示、图片计数
 */
export default function ProductGallery({ images = [] }) {
  const imgSrc = useImg()
  // 当前选中该变体下第几张图
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  // ✅ swipe refs（手机端左右滑）
  const touchStartXRef = useRef(null)
  const touchStartYRef = useRef(null)
  const swipingRef = useRef(false)
  const SWIPE_THRESHOLD = 40 // px

  if (!images || images.length === 0) {
    return (
      <div className="flex h-96 w-full items-center justify-center rounded-lg border bg-white text-gray-500">
        No image available
      </div>
    )
  }

  // ✅ 安全索引（切换颜色时避免越界）
  const safeIndex =
    selectedImageIndex >= 0 && selectedImageIndex < images.length
      ? selectedImageIndex
      : 0

  const nextImage = () => {
    setSelectedImageIndex((prev) => {
      const base = prev >= 0 && prev < images.length ? prev : 0
      return (base + 1) % images.length
    })
  }

  const prevImage = () => {
    setSelectedImageIndex((prev) => {
      const base = prev >= 0 && prev < images.length ? prev : 0
      return (base - 1 + images.length) % images.length
    })
  }

  // ✅ swipe handlers
  const onTouchStart = (e) => {
    if (!images || images.length <= 1) return
    const t = e.touches?.[0]
    if (!t) return
    swipingRef.current = true
    touchStartXRef.current = t.clientX
    touchStartYRef.current = t.clientY
  }

  const onTouchEnd = (e) => {
    if (!images || images.length <= 1) return
    if (!swipingRef.current) return
    swipingRef.current = false

    const startX = touchStartXRef.current
    const startY = touchStartYRef.current
    const t = e.changedTouches?.[0]

    touchStartXRef.current = null
    touchStartYRef.current = null

    if (startX === null || startY === null || !t) return

    const dx = t.clientX - startX
    const dy = t.clientY - startY

    // ✅ 避免和页面上下滚动冲突：只有横向滑为主才翻页
    if (Math.abs(dx) < Math.abs(dy)) return
    if (Math.abs(dx) < SWIPE_THRESHOLD) return

    if (dx < 0) nextImage()
    else prevImage()
  }

  return (
    <>
      {/* ===== 主图区域 ===== */}
      <div
        className="relative mb-4 h-96 w-full overflow-hidden rounded-lg border bg-white touch-pan-y"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <img
          src={imgSrc(images[safeIndex])}
          alt={`Product image ${safeIndex + 1}`}
          onClick={() => setLightboxOpen(true)}
          className="h-full w-full cursor-zoom-in object-contain"
          draggable={false}
        />

        {/* ===== 导航按钮 / 指示器（多图才显示） ===== */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={prevImage}
              aria-label="Previous image"
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 shadow hover:bg-white"
            >
              ←
            </button>

            <button
              type="button"
              onClick={nextImage}
              aria-label="Next image"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 shadow hover:bg-white"
            >
              →
            </button>

            <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
              {images.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setSelectedImageIndex(index)}
                  aria-label={`Go to image ${index + 1}`}
                  className={`h-2 w-2 rounded-full ${
                    index === safeIndex ? 'bg-blue-500' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>

            <div className="absolute right-4 top-4 rounded-full bg-black/50 px-3 py-1 text-sm text-white">
              {safeIndex + 1} / {images.length}
            </div>
          </>
        )}
      </div>

      {/* ===== Lightbox ===== */}
      <Lightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        index={safeIndex}
        slides={images.map((src, index) => ({
          src: imgSrc(src),
          alt: `Product image ${index + 1}`,
        }))}
        render={{
          buttonPrev: images.length > 1 ? undefined : () => null,
          buttonNext: images.length > 1 ? undefined : () => null,
        }}
      />

      {/* ===== 缩略图 ===== */}
      {images.length > 1 && (
        <div className="mb-6">
          <h3 className="mb-2 text-lg font-medium">Gallery</h3>
          <div className="grid grid-cols-4 gap-2 md:grid-cols-6">
            {images.map((img, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setSelectedImageIndex(index)}
                className={`aspect-square overflow-hidden rounded border p-1 ${
                  index === safeIndex
                    ? 'border-blue-500 ring-2 ring-blue-300'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <img
                  src={imgSrc(img)}
                  alt={`Thumbnail ${index + 1}`}
                  className="h-full w-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
