const express = require('express');
const router = express.Router();
const wellnessController = require('../controllers/wellnessController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Rutas de categorías
router.get('/categories', authenticateToken, wellnessController.getCategories);

// Rutas de consejos
router.get('/tips', authenticateToken, wellnessController.getTips);
router.get('/tips/daily', authenticateToken, wellnessController.getDailyTip);

module.exports = router;
