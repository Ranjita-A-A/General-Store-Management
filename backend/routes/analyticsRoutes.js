const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');

// Dashboard analytics routes
router.get('/dashboard', analyticsController.getDashboardStats);
router.get('/top-selling', analyticsController.getTopSellingItems);

module.exports = router;
