// routes/products.js
const productsRouter = require('express').Router()
const productController = require('../controllers/productController')
const { requireAdmin } = require('../middleware/requireAdmin')


// ===== ADMIN =====
// ⚠️ 必须在 /:idorSlug 之前
productsRouter.get('/admin', requireAdmin, productController.getAdminProducts)
productsRouter.get('/admin/:idorSlug', requireAdmin, productController.getAmdinProductByIdorSlug)
productsRouter.post('/admin', requireAdmin, productController.createProduct)
productsRouter.put('/admin/:id', requireAdmin, productController.updateProduct)
productsRouter.delete('/admin/:id', requireAdmin, productController.deleteProduct)
productsRouter.delete('/admin/:id/variants/:key', requireAdmin, productController.deleteProductVariant)
productsRouter.delete('/admin/:id/variants/:key/images', requireAdmin, productController.deleteVariantImage)

// ===== PUBLIC =====
productsRouter.get('/', productController.getPublicProducts)
productsRouter.get('/:idorSlug', productController.getPublicProductByIdorSlug)

module.exports = productsRouter