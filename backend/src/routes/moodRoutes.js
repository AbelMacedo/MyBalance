const express = require('express');
const router = express.Router();
const moodController = require('../controllers/moodController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Rutas de emociones y etiquetas
router.get('/emotions', authenticateToken, moodController.getEmotions);
router.get('/tags', authenticateToken, moodController.getTags);

// Rutas de registros emocionales
router.post('/entries', authenticateToken, moodController.createMoodEntry);
router.get('/entries', authenticateToken, moodController.getMoodEntries);
router.get('/entries/:id', authenticateToken, moodController.getMoodEntryById);
router.put('/entries/:id', authenticateToken, moodController.updateMoodEntry);
router.delete('/entries/:id', authenticateToken, moodController.deleteMoodEntry);

// Rutas de estadísticas
router.get('/trends', authenticateToken, moodController.getMoodTrends);
router.get('/weekly-score', authenticateToken, moodController.getWeeklyMoodScore);

module.exports = router;
