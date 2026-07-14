// src/routes/uploads.js
const express = require('express')
const multer = require('multer') //专门处理文件上传的中间件
const uploadController = require('../controllers/uploadController')
const { requireAdmin } = require('../middleware/requireAdmin')

const router = express.Router()

// multer：先用内存存储（buffer），方便传 S3
/*是你运行 Node.js 的那台机器的内存

- 本地开发: 就是自己电脑的内存（RAM）
- 部署在服务器 / Render / EC2：就是 服务器的内存（RAM）
*/
const upload = multer({
  storage: multer.memoryStorage(),   //将文件存储在内存中
  limits: { fileSize: 10 * 1024 * 1024 }, //限制文件大小为10MB
})

router.post(
  '/images',
  requireAdmin,
  upload.array('images', 5), //最多上传5个文件
  uploadController.uploadImages
)

router.delete(
  '/images',
  requireAdmin,
  uploadController.deleteImage
)

module.exports = router

