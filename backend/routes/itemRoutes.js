const express = require('express');
const router = express.Router();
const itemController = require('../controllers/itemController');

// Debug middleware
router.use((req, res, next) => {
    console.log('Item Route accessed:', {
        method: req.method,
        url: req.url,
        path: req.path,
        params: req.params,
        query: req.query,
        body: req.body
    });
    next();
});

// Reports - Keep these routes before /:id to prevent conflicts
router.get('/profit-report', (req, res) => {
    console.log('Handling profit report request');
    itemController.getProfitReport(req, res);
});
router.get('/sales-stats', itemController.getSalesStats);
router.get('/stock-value', itemController.getStockValueReport);

// Categories
router.get('/categories', itemController.getAllCategories);
router.get('/category/:category', itemController.getItemsByCategory);

// Stock management
router.get('/low-stock', itemController.getLowStockItems);

// Basic CRUD operations
router.get('/', itemController.getAllItems);
router.post('/', itemController.createItem);
router.get('/:id', itemController.getItemById);
router.put('/:id', itemController.updateItem);
router.delete('/:id', itemController.deleteItem);
router.put('/:id/stock', itemController.updateItemStock);

module.exports = router;