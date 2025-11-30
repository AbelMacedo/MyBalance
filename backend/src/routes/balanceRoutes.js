const express = require('express');
const router = express.Router();
const balanceController = require('../controllers/balanceController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.post('/', authenticateToken, balanceController.saveDailyBalance);
router.get('/history', authenticateToken, balanceController.getBalanceHistory);
router.get('/:date', authenticateToken, balanceController.getDailyBalance);
router.delete('/:date', authenticateToken, balanceController.deleteBalance);

module.exports = router;
