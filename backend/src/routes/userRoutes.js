const express = require('express');
const router = express.Router();
const userController = require('../controllers/userContoller');
const { authenticateToken } = require('../middleware/authMiddleware');

router.get('/profile', authenticateToken, userController.getProfile);
router.put('/profile', authenticateToken, userController.updateProfile);
router.delete('/account', authenticateToken, userController.deleteAccount);

module.exports = router;
