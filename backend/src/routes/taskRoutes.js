const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Rutas de categorías
router.get('/categories', authenticateToken, taskController.getCategories);

// Rutas de tareas
router.post('/', authenticateToken, taskController.createTask);
router.get('/', authenticateToken, taskController.getTasks);
router.get('/stats', authenticateToken, taskController.getTaskStats);
router.get('/:id', authenticateToken, taskController.getTaskById);
router.put('/:id', authenticateToken, taskController.updateTask);
router.delete('/:id', authenticateToken, taskController.deleteTask);
router.put('/:id/toggle-complete', authenticateToken, taskController.toggleTaskComplete);
router.patch('/:id/postpone', authenticateToken, taskController.postponeTask);

module.exports = router;
