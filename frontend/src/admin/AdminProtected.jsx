// src/admin/AdminProtected.jsx
import { Navigate, Outlet } from 'react-router-dom'
import { getAdminToken } from './auth'

export default function AdminProtected() {
  const token = getAdminToken()

  if (!token) {
    // 如果没有 token，重定向到登录页
    return <Navigate to="/admin/login" replace />
  }

  // 有 token，渲染子路由组件
  return <Outlet />
}
