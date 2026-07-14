// src/components/JsonLd.jsx
// 渲染一段 JSON-LD 结构化数据。放在 body 内即可,Google 同样会读取。
export default function JsonLd({ data }) {
  if (!data) return null
  return (
    <script
      type="application/ld+json"
      // JSON-LD 不是可执行 JS,这里只是把结构化数据写进 DOM
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}
