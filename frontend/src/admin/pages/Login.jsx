// src/amin/pages/Login.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { setAdminToken } from '../auth'

export default function AdminLogin() {
  const [userName, setUserName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleLogin = async (e) => {

    e.preventDefault() // 阻止表单默认提交行为
    setError('')

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: userName, password }),
      })

      let data = {}
      // 尝试解析响应体为 JSON
      try {
        data = await res.json()
      } catch (err) {
        console.error('Failed to parse JSON response:', err)
        // 解析失败就忽略，data 仍然是空对象
      }

      if (!res.ok) {
        let message = '登录失败'

        if (res.status === 401) {
          message = '用户名或密码错误'
        } else if (res.status === 403) {
          message = '没有管理员权限'
        } else if (res.status >= 500) {
          message = '服务器错误，请稍后再试'
        }

        throw new Error(message)
      }

      setAdminToken(data.token)
      navigate('/admin', { replace: true }) // 登录成功后跳转到管理员首页

    } catch (err) {
      setError(err.message || '登录失败，请重试')
    }

  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-sm bg-white border p-6">

        {/* 标题区 */}
        <h2 className="text-base font-semibold mb-1">
          管理员登录
        </h2>
        <p className="text-xs text-gray-500 mb-4">
          请输入管理员账号和密码
        </p>

        {/* 错误提示 */}
        {error && (
          <div className="mb-3 text-xs text-red-600">
            {error}
          </div>
        )}

        {/* 表单区 */}
        <form onSubmit={handleLogin} className="space-y-3">

          {/* 用户名 */}
          <div>
            <label className="block text-xs text-gray-600 mb-1">
              用户名 Username
            </label>
            <input
              className="w-full border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black"
              placeholder="请输入用户名"
              value={userName}
              onChange={e => setUserName(e.target.value)}
            />
          </div>

          {/* 密码 */}
          <div>
            <label className="block text-xs text-gray-600 mb-1">
              密码 Password
            </label>
            <input
              type="password"
              className="w-full border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black"
              placeholder="请输入密码"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>

          {/* 提交按钮 */}
          <button
            type="submit"
            className="w-full bg-black text-white py-2 text-sm"
          >
            登录 Login
          </button>

        </form>
      </div>
    </div>
  )
}

