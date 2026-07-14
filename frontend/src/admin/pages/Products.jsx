// src/admin/pages/Products.jsx

import { useEffect, useMemo, useState } from 'react'
import { adminFetch } from '../../services/adminApi'
import { useNavigate } from 'react-router-dom'

// 全局 busy 遮罩 + 云任务队列
import BusyOverlay from '../components/BusyOverlay'
import useCloudBusyQueue from '../hooks/useCloudBusyQueue'

// 筛选语义映射
const FILTER_MAP = {
  'create-time': { sort: 'default' }, // sortOrder + createAt
  active: { isActive: true },
  inactive: { isActive: false },

  'shopping-trolley': { category: 'shopping-trolley' },
  'utility-trolley': { category: 'utility-trolley' },
  'camping-wagon': { category: 'camping-wagon' },
  'outdoor-furniture': { category: 'outdoor-furniture' },
}

// 统一拿到“可用的 id”，避免你现在 key 用 mongoId、请求用 product.id 的混乱
const getPid = (p) => p.id || p._id || p.mongoId

export default function AdminProducts() {
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // ⭐ 统一管理云端任务（串行 + BusyOverlay）
  const { busy, runCloudTask, isBusy } = useCloudBusyQueue({
    onError: (msg) => setError(msg),
  })

  // 筛选条件
  const [filter, setFilter] = useState('create-time')

  // 搜索条件：按产品名
  const [search, setSearch] = useState('')

  // pagination
  const PAGE_SIZE = 20
  const [currentPage, setCurrentPage] = useState(1)

  // 观测删除状态，防止重复删除
  const [deletingId, setDeletingId] = useState(null)

  // ===== 拉取产品 =====
  const loadProducts = async () => {
    setLoading(true)
    setError('')

    try {
      const data = await adminFetch('/api/products/admin') // admin token 控制
      const list = Array.isArray(data) ? data : (data.items || [])

      setProducts(list)
    } catch (err) {
      setError((err?.message ? `${err.message} - ` : '') + '获取产品列表失败 (请尝试重新登录)')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // ⭐ 初次加载也用 runCloudTask：避免用户刷新/切页时乱点
    runCloudTask('加载产品列表中，请耐心等候', async () => {
      await loadProducts()
    }).catch(() => {}) // runCloudTask 会 throw，这里吃掉，避免 React 报未处理
  }, []) // eslint-disable-line

  // ===== 过滤 + 排序（前端本地）=====
  // useMemo 在render期间缓存计算结果，依赖 products, filter 和 search改变时重新计算
  const filteredAndSorted = useMemo(() => {
    const config = FILTER_MAP[filter] || {}

    let list = [...products]

    // 过滤: 状态
    // isActive 如果有定义为boolean，而不是undefined或者null，则过滤
    if (typeof config.isActive === 'boolean') {
      list = list.filter((p) => !!p.isActive === config.isActive)
      // !! 确保 p.isActive 一定是 boolean, 防止 undefined/null (具体看！！的用法)
    }

    // 过滤: 分类
    if (config.category) {
      list = list.filter((p) => p.category === config.category)
    }

    // 过滤: 名称搜索（包含匹配）
    const q = (search ?? '').toString().trim().toLowerCase()
    if (q) {
      list = list.filter((p) =>
        (p?.name ?? '').toString().trim().toLowerCase().includes(q)
      )
    }

    // 排序: 默认按 sortOrder 降序、time 降序
    list.sort((a, b) => {
      const aSort = Number(a.sortOrder || 0)
      const bSort = Number(b.sortOrder || 0)
      if (bSort !== aSort) {
        return bSort - aSort
      }

      // 次级排序：按时间降序 - create优先
      const aTime = new Date(a.createdAt || a.updatedAt || 0).getTime()
      const bTime = new Date(b.createdAt || b.updatedAt || 0).getTime()

      return bTime - aTime
    })

    return list
  }, [products, filter, search])

  // filter或search 改变时：回到第 1 页
  useEffect(() => {
    setCurrentPage(1)
  }, [filter, search])

  // ===== 分页 =====
  const totalPages = Math.ceil(filteredAndSorted.length / PAGE_SIZE)

  const pagedProducts = filteredAndSorted.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  )

  // ===== currentPage 超出 totalPages 时，调整 currentPage =====
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages || 1)
    }
  }, [totalPages, currentPage])

  // ===== 上下架 toggle =====
  const toggleActive = async (product) => {
    if (isBusy) return // ⭐ 全局忙就不让点（也可以不写，因为 overlay 会挡住）

    const next = !product.isActive
    const pid = getPid(product)

    try {
      await runCloudTask(next ? '上架中，请耐心等候' : '下架中，请耐心等候', async () => {
        await adminFetch(`/api/products/admin/${pid}`, {
          method: 'PUT',
          body: { isActive: next },
        })

        await loadProducts()
      })
    } catch (err) {
      // 这里不需要 alert：runCloudTask 已经 onError(setError) 了
      // 但你如果习惯弹窗也可以加 alert
      console.log(err)
    }
  }

  // ===== 删除 =====
  const deleteProduct = async (product) => {
    if (isBusy || deletingId) {
      alert('已有操作在进行中，请稍后再试')
      return
    }

    const ok = window.confirm(
      `确定要删除产品 "${product.name}" 吗？\n此操作不可撤销 !`
    )
    if (!ok) return

    const pid = getPid(product)
    setDeletingId(pid)

    try {
      await runCloudTask('删除产品中，请耐心等候 ☁️', async () => {
        await adminFetch(`/api/products/admin/${pid}`, {
          method: 'DELETE',
        })

        await loadProducts()
      })
    } catch (err) {
      console.log(err)
      // runCloudTask 已经 onError(setError) 了
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <>
      <BusyOverlay open={busy.open} text={busy.text || '云端操作中，请耐心等候 ☁️'} />

      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">Products 产品管理</h2>

        <div className="flex items-center gap-2">
          {/* 搜索框：按产品名 */}
          <div className="flex-1 flex justify-center">
            <div className="relative w-96">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="🔍 搜索产品名称..."
                className="
                  w-full
                  px-4 py-2
                  text-sm
                  border border-gray-200
                  rounded-lg
                  shadow-sm
                  focus:outline-none
                  focus:ring-2
                  focus:ring-indigo-400
                  focus:border-indigo-400
                  bg-white
                "
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="
                    absolute right-2 top-1/2 -translate-y-1/2
                    text-gray-400 hover:text-gray-700 text-sm
                  "
                  title="清空"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* 筛选 */}
          <div className="flex items-center gap-2 ml-6 mr-6">
            <span className="text-xs text-gray-500">筛选</span>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="
                text-sm
                px-3 py-2
                rounded-lg
                border border-gray-200
                bg-white
                text-gray-700
                focus:outline-none
                focus:ring-2
                focus:ring-indigo-400
                focus:border-indigo-400
                transition
              "
            >
              <optgroup label="排序">
                <option value="create-time">最新更新（默认）</option>
              </optgroup>
              <optgroup label="产品状态">
                <option value="active">仅已上架</option>
                <option value="inactive">仅未上架</option>
              </optgroup>
              <optgroup label="分类">
                <option value="shopping-trolley">Shopping Trolley</option>
                <option value="utility-trolley">Utility Trolley</option>
                <option value="camping-wagon">Camping Wagon</option>
                <option value="outdoor-furniture">Outdoor Furniture</option>
              </optgroup>
            </select>
          </div>

          {/* 新增产品按钮 */}
          <button
            onClick={() => navigate('/admin/products-create')}
            className="
              text-sm
              px-5 py-2.5
              rounded-xl
              bg-indigo-50
              border border-indigo-100
              text-indigo-700
              font-medium
              shadow-sm
              hover:bg-indigo-100
              hover:shadow-md
              active:scale-[0.98]
              transition-all
            "
          >
            + 新增产品
          </button>
        </div>
      </div>

      {/* 结果统计 */}
      {!loading && !error && (
        <div className="text-xs text-gray-500 mb-2">
          共 {filteredAndSorted.length} 条（原始 {products.length} 条）
        </div>
      )}

      {loading && <div className="text-sm text-gray-600">Loading...</div>}

      {error && <div className="text-sm text-red-600">{error}</div>}

      {!loading && !error && filteredAndSorted.length === 0 && (
        <div className="text-sm text-gray-600">暂无符合筛选条件的产品</div>
      )}

      {!loading && !error && filteredAndSorted.length > 0 && (
        <>
          <ul className="space-y-2">
            {pagedProducts.map((p) => {
              const pid = getPid(p) //
              const isDeleting = deletingId === pid
              return (
                <li
                  key={pid}
                  className={`border rounded-lg p-4 text-base ${
                    !p.isActive ? 'bg-gray-50 text-gray-400' : ''
                  }`}
                >
                  <div className="flex justify-between items-start gap-6">
                    {/* 左侧：核心信息 */}
                    <div className="space-y-1">
                      <div className="font-semibold text-base">
                        {p.name}
                        <span className="ml-3 text-sm text-gray-500">
                          产品类型: {p.category}
                        </span>
                      </div>

                      <div className="text-sm text-gray-500">
                        {/* slug: {p.slug} ·  */}
                        排名权重 sort: {p.sortOrder}
                      </div>
                    </div>

                    {/* 右侧：操作 */}
                    <div className="flex items-center gap-3 shrink-0">
                      <button
                        onClick={() => navigate(`/admin/products/${pid}`)}
                        className="text-sm px-3 py-1.5 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100"
                      >
                        编辑 ⚙️
                      </button>

                      <button
                        onClick={() => toggleActive(p)}
                        className={`text-sm px-3 py-1.5 rounded-md border ${
                          p.isActive
                            ? 'border-blue-500 text-blue-600 hover:bg-blue-100'
                            : 'border-gray-300 text-gray-500 hover:bg-gray-100'
                        }`}
                      >
                        {p.isActive ? '下架' : '上架'}
                      </button>

                      <button
                        disabled={!!deletingId}
                        onClick={() => deleteProduct(p)}
                        className={`text-sm px-3 py-1.5 rounded-md border border-red-500 transition ${
                          isDeleting
                            ? 'opacity-60 cursor-not-allowed text-red-600'
                            : deletingId
                              ? 'opacity-40 cursor-not-allowed text-gray-400'
                              : 'text-red-600 hover:bg-red-50'
                        }`}
                      >
                        {isDeleting ? '删除中…' : '删除'}
                      </button>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>

          {/* 分页 */}
          {totalPages > 1 && (
            <div className="mt-4 flex justify-center items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-2 py-1 border rounded disabled:opacity-50"
              >
                上一页
              </button>
              <span className="text-sm">
                第 {currentPage} 页 / 共 {totalPages} 页
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-2 py-1 border rounded disabled:opacity-50"
              >
                下一页
              </button>
            </div>
          )}
        </>
      )}
    </>
  )
}
