// routes/productRoutes.js
const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

// Rutas de productos
router.get('/', productController.getAllProducts);
router.post('/', productController.createProduct);
router.get('/export-csv', productController.exportToCSV); // Ruta para exportar a CSV
router.get('/:id', productController.getProductById);
router.put('/:id', productController.updateProduct);
router.delete('/:id', productController.deleteProduct);

module.exports = router;