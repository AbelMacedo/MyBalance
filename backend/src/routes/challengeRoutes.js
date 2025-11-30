const express = require('express');
const router = express.Router();
const challengeController = require('../controllers/challengeController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Rutas de retos
router.get('/', authenticateToken, challengeController.getChallenges);
router.post('/join', authenticateToken, challengeController.joinChallenge);
router.get('/user', authenticateToken, challengeController.getUserChallenges);
router.put('/:user_challenge_id/progress', authenticateToken, challengeController.updateChallengeProgress);
router.get('/ranking', authenticateToken, challengeController.getRanking);
router.delete('/:user_challenge_id', authenticateToken, challengeController.abandonChallenge);

module.exports = router;
