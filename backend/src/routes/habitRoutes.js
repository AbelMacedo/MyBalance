const express = require('express');
const router = express.Router();
const habitController = require('../controllers/habitController');
const habitCompletionController = require('../controllers/habitCompletionController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.post('/', authenticateToken, habitController.createHabit);
router.get('/', authenticateToken, habitController.getHabits);
router.get('/categories', authenticateToken, habitController.getCategories);
router.get('/:id', authenticateToken, habitController.getHabitById);
router.put('/:id', authenticateToken, habitController.updateHabit);
router.delete('/:id', authenticateToken, habitController.deleteHabit);
router.patch('/:id/toggle-pause', authenticateToken, habitController.togglePauseHabit);

router.post('/completions', authenticateToken, habitCompletionController.completeHabit);
router.get('/:habit_id/completions', authenticateToken, habitCompletionController.getHabitCompletions);
router.get('/:habit_id/stats', authenticateToken, habitCompletionController.getHabitStats);

module.exports = router;
