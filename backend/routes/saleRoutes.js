const express = require('express');
const router = express.Router();
const saleController = require('../controllers/saleController');

// Record a new sale
router.post('/', saleController.recordSale);

// Get sales report
router.get('/', saleController.getSalesReport);

module.exports = router;