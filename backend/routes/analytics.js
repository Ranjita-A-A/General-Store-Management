const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');

// GET /api/analytics/dashboard
router.get('/dashboard', analyticsController.getDashboardStats);

module.exports = router;
