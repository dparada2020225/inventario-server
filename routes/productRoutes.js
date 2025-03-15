// routes/productRoutes.js
const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { protect, admin } = require('../middleware/authMiddleware');

// Rutas públicas (cualquiera puede ver los productos)
router.get('/', productController.getAllProducts);
router.get('/:id', productController.getProductById);

// Rutas protegidas (solo para admins)
router.post('/', protect, productController.createProduct);
router.put('/:id', protect, productController.updateProduct);
router.delete('/:id', protect, productController.deleteProduct);
router.get('/export-csv', protect, productController.exportToCSV);

module.exports = router;