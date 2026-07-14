// src/admin/pages/Inquiries.jsx
import { useEffect, useState } from 'react'
import { adminFetch } from '../../services/adminApi'

export default function AdminInquiries() {
  const [inquiries, setInquiries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // 筛选条件状态
  const [filter, setFilter] = useState('time-desc') // 'time-desc' | 'time-asc' |'status-new' | 'status-done'

  // 分页
  const PAGE_SIZE = 5  // 每页显示数量
  const [currentPage, setCurrentPage] = useState(1)

  // 加载询盘列表数据
  const loadInquiries= async () => {
    setLoading(true)
    setError('')

    try {
      const data = await adminFetch('/api/inquiries/admin')
      const list = Array.isArray(data)
        ? data
        : (data.items || []) // 兼容不同返回格式
        // data.items 是一种“后端常见返回格式”的兜底写法

      setInquiries(list)
    } catch (err) {
      setError(err?.message ? `${err.message} - 加载询盘失败 (请尝试重新登录)` : '加载询盘失败 (请尝试重新登录)')

    } finally {
      setLoading(false)
      // finally: 无论成功失败都会执行
    }
  }

  // 拉取询盘列表所有数据
  useEffect(() => {
    loadInquiries()
  }, [])

  // ===== filter 改变时，回到第一页 =====
  useEffect(() => {
    setCurrentPage(1)
  }, [filter])

  // toggleStatus 更改询盘状态（new <-> done）
  // currentStatus = 'new': 默认值 (防止 undefined)
  const toggleStatus = async (inquiryId, currentStatus = 'new') => {
    // 计算下一个状态
    const nextStatus = currentStatus === 'new' ? 'done' : 'new'

    try {
      await adminFetch(`/api/inquiries/admin/${inquiryId}`, {
        method: 'PUT',
        body: { status: nextStatus },
      })

      // 本地更新状态
      setInquiries(prevInquiries =>
        prevInquiries.map(i =>
          i._id === inquiryId || i.id === inquiryId
            ? { ...i, status: nextStatus }
            : i
        )
      )
    } catch (err) {
      alert(err?.message ? `${err.message}\n更新询盘状态失败` : '更新询盘状态失败')
    }
  }

  // deleteInquiry 删除询盘
  const deleteInquiry = async (inquiryId) => {
    const ok = window.confirm('确定要删除此询盘吗？\n此操作不可撤销! \n询盘数据将会永久删除 !!!')
    if (!ok) return

    try {

      await adminFetch(`/api/inquiries/admin/${inquiryId}`, {
        method: 'DELETE',
      })

      // 策略一：服务器删除后, 后端刷新列表
      loadInquiries()

      // 策略二：前端本地删除
      // setInquiries(prevInquiries =>
      //   prevInquiries.filter(i =>
      //     i._id !== inquiryId && i.id !== inquiryId
      //   )
      // )

    } catch (err) {
      alert(err?.message ? `${err.message} - 删除询盘失败` : '删除询盘失败')
    }
  }

  // 派生后的列表（筛选 / 排序）
  const filteredInquiries = (() => {
    let list = [...inquiries]

    // 根据筛选条件过滤和排序
    if (filter === 'status-new') {
      list = list.filter(i => i.status === 'new')
    } else if (filter === 'status-done') {
      list = list.filter(i => i.status === 'done')
    } else if (filter === 'time-asc') {
      list.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    } else {
      // 默认按创建时间降序排序
      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    }

    return list
  })()
  // IIFE: 立即调用函数表达式 (Immediately Invoked Function Expression)
  // 把这个函数立刻执行一次，并把返回值赋给 filteredInquiries
  // 每次 render 重新算一遍, 这样就不需要额外的状态变量来存储筛选后的列表了
  // 缺点是每次 render 都会重新计算，性能稍差，但对于小列表来说影响不大

  // 分页 向上取整
  const totalPages = Math.ceil(filteredInquiries.length / PAGE_SIZE)

  // .slice: 从0开始截取数组
  const pagedInquiries = filteredInquiries.slice(
    (currentPage - 1) * PAGE_SIZE, // 起始索引 比如 currentPage=2 时，起始索引是 2-1* PAGESIZE （包含）
    currentPage * PAGE_SIZE        // 结束索引 比如 currentPage=2 时，结束索引是 2* PAGESIZE（不包含）
  )

  // ===== currentPage 超出 totalPages 时，调整 currentPage =====
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages || 1)
    }
  }, [totalPages, currentPage])


  return(
    <>
      <h2 className="text-base font-semibold mb-3">
        Inquiries 询盘列表
      </h2>

      {/* Select 视图选择器 */}
      <div className="mb-3 flex items-center gap-2 text-sm">
        <span className="text-gray-500">视图：</span>
        <select
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="border rounded px-2 py-1"
        >
          <option value="time-desc">按时间降序</option>
          <option value="time-asc">按时间升序</option>
          <option value="status-new">未跟踪</option>
          <option value="status-done">已跟踪/完成</option>
        </select>
      </div>

      {loading && (
        <div className="text-sm text-gray-600">
          Loading...
        </div>
      )}

      {error && (
        <div className="text-sm text-red-600">
          {error}
        </div>
      )}

      {!loading && !error && inquiries.length === 0 && (
        <div className="text-sm text-gray-600">
          暂无询盘
        </div>
      )}

      {!loading && !error && inquiries.length > 0 && (
        <>
          <ul className="space-y-2">
            {pagedInquiries.map(i => (
              <li
                key={i._id || i.id}
                className={`border p-2 text-sm ${
                  i.status === 'done'
                    ? 'bg-gray-50 text-gray-300'
                    : ''
                }` }
              >
                {/* 名字和邮件 + 操作按钮 */}
                <div className="font-medium flex justify-between items-center">
                  <span className="font-medium">
                    {(i.name || 'Unknown')} · {(i.email || '-')}
                  </span>
                  <br></br>

                  <div className="flex items-center gap-2">
                    {/* 状态按钮 */}
                    <button
                      onClick={() =>
                        toggleStatus(i._id || i.id, i.status || 'new')
                      }
                      className={`text-xs px-2 py-1 rounded border ${
                        i.status === 'done'
                          ? 'border-gray-300 text-gray-500 hover:bg-blue-50 hover:text-blue-600'
                          : 'border-blue-500 text-blue-600 hover:bg-blue-100'
                      }`}
                    >
                      {i.status === 'done' ? '未跟踪' : '已跟踪/完成'}
                    </button>

                    {/* 删除按钮 */}
                    <button
                      onClick={() => deleteInquiry(i._id || i.id)}
                      className="text-xs px-2 py-1 rounded border border-red-500 text-red-600 hover:bg-red-50"
                    >
                      删除
                    </button>
                  </div>
                </div>

                {/* 消息内容 */}
                <div className="whitespace-pre-wrap">
                  {i.message || '-'}
                </div>

                {/* 创建时间 */}
                <div className="text-xs text-gray-400 mt-1">
                  {i.createdAt
                    ? new Date(i.createdAt).toLocaleString()
                    : ''}
                </div>
              </li>

            ))}
          </ul>

          {/* 分页控制 */}
          {totalPages > 1 && (
            <div className="mt-4 flex justify-center items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-2 py-1 border rounded disabled:opacity-50"
              >
                上一页
              </button>
              <span className="text-sm">
                第 {currentPage} 页，共 {totalPages} 页
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
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