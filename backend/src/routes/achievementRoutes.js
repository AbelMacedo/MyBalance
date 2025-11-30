const express = require('express');
const router = express.Router();
const achievementController = require('../controllers/achievementController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Rutas de logros
router.get('/', authenticateToken, achievementController.getAchievements);
router.get('/user', authenticateToken, achievementController.getUserAchievements);
router.get('/points', authenticateToken, achievementController.getUserPoints);

module.exports = router;
