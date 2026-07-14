// src/admin/AdminLayout.jsx
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { clearAdminToken } from './auth'

export default function AdminLayout() {
  const navigate = useNavigate()

  const handleLogout = () => {
    clearAdminToken()
    navigate('/admin/login', { replace: true })
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside
        style={{
          width: 200,
          padding: 16,
          borderRight: '1px solid #e5e5e5',
          boxSizing: 'border-box'
        }}
      >

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <NavLink
            to="/admin"
            className="
                text-sm
                font-medium
                text-gray-700
                hover:text-gray-400
                transition-colors
            "
          >
            Dashboard 菜单
          </NavLink>

          <NavLink
            to="/admin/products"
            className="
              text-sm
              font-medium
              text-gray-700
              hover:text-gray-400
              transition-colors
            "
          >
            Products 产品管理
          </NavLink>

          <NavLink
            to="/admin/inquiries"
            className="
              text-sm
              font-medium
              text-gray-700
              hover:text-gray-400
              transition-colors
            "
          >
            Inquiries 询盘管理
          </NavLink>
        </nav>

        <button
          onClick={handleLogout}
          className="
            mt-4 w-full text-red-600 border border-gray-200
            py-1 text-sm
            hover:bg-red-50
          "
        >
          Logout 退出登录
        </button>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: 24 }}>
        <Outlet />
      </main>
    </div>
  )
}

