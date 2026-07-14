// src/components/Seo.jsx
// 每页 SEO 头信息。利用 React 19 原生特性:在组件里渲染的
// <title> / <meta> / <link> 会被自动提升到 <head>,无需 react-helmet。
import { SITE_NAME, DEFAULT_DESCRIPTION, DEFAULT_OG_IMAGE, absoluteUrl } from '../lib/site'

export default function Seo({
  title,
  description,
  path = '',
  image,
  type = 'website',
  // 传 true 时标题不追加 " | Juxin Manufacturing" 后缀
  bareTitle = false,
  // 传 true 时告诉搜索引擎不要收录本页（如 404）
  noindex = false,
}) {
  const fullTitle = title
    ? (bareTitle ? title : `${title} | ${SITE_NAME}`)
    : `${SITE_NAME} | Shopping Trolley & Utility Cart Manufacturer`

  const desc = description || DEFAULT_DESCRIPTION
  const url = absoluteUrl(path)
  const img = image || DEFAULT_OG_IMAGE

  return (
    <>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      {noindex
        ? <meta name="robots" content="noindex, follow" />
        : <link rel="canonical" href={url} />}

      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={img} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={img} />
    </>
  )
}
