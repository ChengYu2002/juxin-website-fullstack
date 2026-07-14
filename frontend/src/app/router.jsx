// src/app/router.jsx
import { Routes, Route } from 'react-router-dom'

// public pages
import Home from '../pages/Home'
import Products from '../pages/Products'
import Product from '../pages/Product'
import About from '../pages/About'
import Contact from '../pages/Contact'
import NotFound from '../pages/NotFound'
import ProductsLayout from '../layouts/ProductsLayout'

// admin pages
import AdminLogin from '../admin/pages/Login'
import AdminDashboard from '../admin/pages/Dashboard'
import AdminProducts from '../admin/pages/Products'
import AdminProductEdit from '../admin/pages/ProductEdit'
import AdminProductCreate from '../admin/pages/ProductCreate'
import AdminInquiries from '../admin/pages/Inquiries'
import AdminProtected from '../admin/AdminProtected'
import AdminLayout from '../admin/AdminLayout'

export default function AppRouter() {
  return (
    <Routes>
      {/* ===== Public ===== */}
      <Route path="/" element={<Home />} />
      <Route path="/products/:id" element={<Product />} />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/products" element={<ProductsLayout />}>
        <Route index element={<Products />} />
      </Route>

      {/* ===== Admin Login（不需要保护） ===== */}
      <Route path="/admin/login" element={<AdminLogin />} />

      {/* ===== Admin Protected Area ===== */}
      <Route path="/admin" element={<AdminProtected />}>
        <Route element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="products/:id" element={<AdminProductEdit />} />
          <Route path="products-create" element={<AdminProductCreate />} />
          <Route path="inquiries" element={<AdminInquiries />} />
        </Route>
      </Route>

      {/* ===== Fallback ===== */}
      <Route path="*" element={<NotFound />} />

    </Routes>
  )
}