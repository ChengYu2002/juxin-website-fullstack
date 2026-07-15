//src/app.js
const path = require('path')
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')

const inquiryRouter = require('./routes/inquiry')
const adminAuthRouter = require('./routes/adminAuth')
const productsRouter = require('./routes/products')
const uploadsRouter = require('./routes/uploads')
const chatRouter = require('./routes/chat')
const { requestLogger } = require('./middleware/requestLogger')
const { unknownEndpoint } = require('./middleware/unknownEndpoint')
const { errorHandler } = require('./middleware/errorHandler')

const app = express()
// const path = require('path')
/**
 * ✅ trust proxy
 * 如果以后部署到 Nginx/Cloudflare/Render/Heroku 等反向代理后面，
 * 需要这句才能正确识别真实 IP（req.ip / x-forwarded-for）
 */
app.set('trust proxy', 1)

// helmet：给 Express 默认把“安全门窗”关好，防一些常见的低级攻击
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        // 👇 关键就在这里
        'img-src': [
          '\'self\'',
          'data:',
          'blob:',
          'https://juxin-images-cn.oss-cn-hangzhou.aliyuncs.com',
          'https://img.juxin-manufacturing.com',
        ],
      },
    },
  })
)

if (process.env.NODE_ENV !== 'production') {
  app.use(cors()) // 仅开发联调用
  // 后续版本可以用白名单形式的 cors 配置
}

// json 解析中间件
app.use(express.json({ limit: '20kb' })) // 限制请求体大小，防止大包打爆内存

// 请求日志中间件（开发环境下启用）
if (process.env.NODE_ENV !== 'production') {
  app.use(requestLogger)
}

// 管理员认证路由
app.use('/api/admin', adminAuthRouter)

// 上传路由
app.use('/api/admin/uploads', uploadsRouter)

// 应用限速中间件到 /api/inquiries 路由
// 也可以放在router/inquiries.js里模块化
app.use('/api/inquiries', inquiryRouter)

// 产品路由
app.use('/api/products', productsRouter)

// 售前 AI 助理对话路由（P1 纯对话）
app.use('/api/chat', chatRouter)

// 静态文件中间件，托管前端打包后的静态资源
// ✅ 用绝对路径更稳：因为 app.js 在 src/，dist 通常在项目根目录
const clientDistPath = path.resolve(__dirname, '..', 'dist')
app.use(express.static(clientDistPath))

// ✅ SPA 兜底：非 /api 的请求都交给前端路由
// 这样 /admin、/products、/contact 等前端路由都会返回 dist/index.html
app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(clientDistPath, 'index.html'))
})

// 404 处理中间件: unknown endpoint
app.use(unknownEndpoint)

// 错误处理中间件（必须放在所有路由之后）: error handler
app.use(errorHandler)

module.exports = app
