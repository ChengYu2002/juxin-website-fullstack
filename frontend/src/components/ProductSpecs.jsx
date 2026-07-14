export default function ProductSpecs({ specs, moq }) {
  // specs 里的字段(过滤空值 / 数字 0)
  const specEntries = specs
    ? Object.entries(specs).filter(([, value]) => {
      // null / undefined
      if (value === null) return false

      // number: 0 不显示
      if (typeof value === 'number') return value !== 0

      // string: 空字符串 / 全空格不显示
      if (typeof value === 'string') return value.trim() !== ''

      // 其他类型（一般不会有）
      return false
    })
    : []

  // MOQ 是 product 顶层字段(不属于 specs),单独拼进规格表,仅 > 0 显示
  const rows = []
  if (typeof moq === 'number' && moq > 0) {
    rows.push(['MOQ', `${moq} pcs`])
  }
  rows.push(...specEntries)

  if (rows.length === 0) return null

  return (
    <div className="mt-12">
      <h3 className="mb-3 text-xl font-semibold">Specifications</h3>
      <div className="rounded-xl border bg-gray-50 p-5">
        <table className="w-full">
          <tbody>
            {rows.map(([key, value]) => (
              <tr key={key} className="border-b last:border-b-0">
                <td className="py-2 font-medium capitalize">
                  {key.replaceAll('_', ' ')}:
                </td>
                <td className="py-2 text-gray-700 whitespace-pre-line">
                  {value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
