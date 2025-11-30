const db = require('../config/database');

// Obtener categorías de tareas
exports.getCategories = async (req, res) => {
    try {
        const [categories] = await db.query(
            'SELECT * FROM task_categories ORDER BY name'
        );

        res.json({
            success: true,
            data: { categories }
        });

    } catch (error) {
        console.error('Error al obtener categorías:', error);
        res.status(500).json({
            success: false,
            message: 'Error en el servidor'
        });
    }
};

// RF-11: Crear tarea
exports.createTask = async (req, res) => {
    try {
        const userId = req.userId;
        const {
            title,
            description,
            category_id,
            priority,
            estimated_time,
            task_date,
            is_recurring,
            recurrence_pattern,
            reminder_enabled,
            reminder_time
        } = req.body;

        // Validaciones
        if (!title || !task_date) {
            return res.status(400).json({
                success: false,
                message: 'El título y la fecha son obligatorios'
            });
        }

        if (title.length > 200) {
            return res.status(400).json({
                success: false,
                message: 'El título no puede superar los 200 caracteres'
            });
        }

        // Insertar tarea
        const [result] = await db.query(
            `INSERT INTO tasks
            (user_id, title, description, category_id, priority, estimated_time,
             task_date, is_recurring, recurrence_pattern, reminder_enabled, reminder_time)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                userId,
                title,
                description || null,
                category_id || null,
                priority || 'medium',
                estimated_time || null,
                task_date,
                is_recurring || false,
                recurrence_pattern || null,
                reminder_enabled || false,
                reminder_time || null
            ]
        );

        res.status(201).json({
            success: true,
            message: 'Tarea creada exitosamente',
            data: {
                task_id: result.insertId
            }
        });

    } catch (error) {
        console.error('Error al crear tarea:', error);
        res.status(500).json({
            success: false,
            message: 'Error en el servidor'
        });
    }
};

// Obtener tareas
exports.getTasks = async (req, res) => {
    try {
        const userId = req.userId;
        const { task_date, is_completed, category_id } = req.query;

        let query = `
            SELECT
                t.*,
                tc.name as category_name,
                tc.icon as category_icon,
                tc.color as category_color
            FROM tasks t
            LEFT JOIN task_categories tc ON t.category_id = tc.id
            WHERE t.user_id = ?
        `;

        const params = [userId];

        // Filtros opcionales
        if (task_date) {
            query += ' AND t.task_date = ?';
            params.push(task_date);
        }

        if (is_completed !== undefined) {
            query += ' AND t.is_completed = ?';
            params.push(is_completed === 'true' ? 1 : 0);
        }

        if (category_id) {
            query += ' AND t.category_id = ?';
            params.push(category_id);
        }

        query += ' ORDER BY t.task_date DESC, t.priority DESC, t.created_at DESC';

        const [tasks] = await db.query(query, params);

        res.json({
            success: true,
            data: { tasks }
        });

    } catch (error) {
        console.error('Error al obtener tareas:', error);
        res.status(500).json({
            success: false,
            message: 'Error en el servidor'
        });
    }
};

// Obtener tarea por ID
exports.getTaskById = async (req, res) => {
    try {
        const userId = req.userId;
        const { id } = req.params;

        const [tasks] = await db.query(
            `SELECT
                t.*,
                tc.name as category_name,
                tc.icon as category_icon,
                tc.color as category_color
            FROM tasks t
            LEFT JOIN task_categories tc ON t.category_id = tc.id
            WHERE t.id = ? AND t.user_id = ?`,
            [id, userId]
        );

        if (tasks.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Tarea no encontrada'
            });
        }

        res.json({
            success: true,
            data: { task: tasks[0] }
        });

    } catch (error) {
        console.error('Error al obtener tarea:', error);
        res.status(500).json({
            success: false,
            message: 'Error en el servidor'
        });
    }
};

// RF-15: Actualizar tarea
exports.updateTask = async (req, res) => {
    try {
        const userId = req.userId;
        const { id } = req.params;
        const {
            title,
            description,
            category_id,
            priority,
            estimated_time,
            task_date,
            is_recurring,
            recurrence_pattern,
            reminder_enabled,
            reminder_time
        } = req.body;

        // Verificar que la tarea pertenece al usuario
        const [tasks] = await db.query(
            'SELECT id FROM tasks WHERE id = ? AND user_id = ?',
            [id, userId]
        );

        if (tasks.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Tarea no encontrada'
            });
        }

        // Actualizar tarea
        await db.query(
            `UPDATE tasks SET
                title = COALESCE(?, title),
                description = COALESCE(?, description),
                category_id = COALESCE(?, category_id),
                priority = COALESCE(?, priority),
                estimated_time = COALESCE(?, estimated_time),
                task_date = COALESCE(?, task_date),
                is_recurring = COALESCE(?, is_recurring),
                recurrence_pattern = COALESCE(?, recurrence_pattern),
                reminder_enabled = COALESCE(?, reminder_enabled),
                reminder_time = COALESCE(?, reminder_time)
            WHERE id = ? AND user_id = ?`,
            [
                title,
                description,
                category_id,
                priority,
                estimated_time,
                task_date,
                is_recurring,
                recurrence_pattern,
                reminder_enabled,
                reminder_time,
                id,
                userId
            ]
        );

        res.json({
            success: true,
            message: 'Tarea actualizada exitosamente'
        });

    } catch (error) {
        console.error('Error al actualizar tarea:', error);
        res.status(500).json({
            success: false,
            message: 'Error en el servidor'
        });
    }
};

// RF-12: Marcar tarea como completada
exports.toggleTaskComplete = async (req, res) => {
    try {
        const userId = req.userId;
        const { id } = req.params;

        // Verificar que la tarea pertenece al usuario
        const [tasks] = await db.query(
            'SELECT is_completed FROM tasks WHERE id = ? AND user_id = ?',
            [id, userId]
        );

        if (tasks.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Tarea no encontrada'
            });
        }

        const newCompletedState = !tasks[0].is_completed;
        const completedAt = newCompletedState ? new Date() : null;

        await db.query(
            'UPDATE tasks SET is_completed = ?, completed_at = ? WHERE id = ?',
            [newCompletedState, completedAt, id]
        );

        res.json({
            success: true,
            message: newCompletedState ? 'Tarea completada' : 'Tarea marcada como pendiente',
            data: { is_completed: newCompletedState }
        });

    } catch (error) {
        console.error('Error al completar tarea:', error);
        res.status(500).json({
            success: false,
            message: 'Error en el servidor'
        });
    }
};

// RF-15: Eliminar tarea
exports.deleteTask = async (req, res) => {
    try {
        const userId = req.userId;
        const { id } = req.params;

        // Verificar que la tarea pertenece al usuario
        const [tasks] = await db.query(
            'SELECT id FROM tasks WHERE id = ? AND user_id = ?',
            [id, userId]
        );

        if (tasks.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Tarea no encontrada'
            });
        }

        await db.query('DELETE FROM tasks WHERE id = ?', [id]);

        res.json({
            success: true,
            message: 'Tarea eliminada exitosamente'
        });

    } catch (error) {
        console.error('Error al eliminar tarea:', error);
        res.status(500).json({
            success: false,
            message: 'Error en el servidor'
        });
    }
};

// RF-12: Posponer tarea para otro día
exports.postponeTask = async (req, res) => {
    try {
        const userId = req.userId;
        const { id } = req.params;
        const { new_date } = req.body;

        if (!new_date) {
            return res.status(400).json({
                success: false,
                message: 'La nueva fecha es obligatoria'
            });
        }

        // Verificar que la tarea pertenece al usuario
        const [tasks] = await db.query(
            'SELECT id FROM tasks WHERE id = ? AND user_id = ?',
            [id, userId]
        );

        if (tasks.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Tarea no encontrada'
            });
        }

        await db.query(
            'UPDATE tasks SET task_date = ? WHERE id = ?',
            [new_date, id]
        );

        res.json({
            success: true,
            message: 'Tarea pospuesta exitosamente'
        });

    } catch (error) {
        console.error('Error al posponer tarea:', error);
        res.status(500).json({
            success: false,
            message: 'Error en el servidor'
        });
    }
};

// Estadísticas de tareas
exports.getTaskStats = async (req, res) => {
    try {
        const userId = req.userId;
        const { start_date, end_date } = req.query;

        let dateFilter = '';
        const params = [userId];

        if (start_date && end_date) {
            dateFilter = 'AND task_date BETWEEN ? AND ?';
            params.push(start_date, end_date);
        }

        // Total de tareas
        const [totalResult] = await db.query(
            `SELECT COUNT(*) as total FROM tasks WHERE user_id = ? ${dateFilter}`,
            params
        );

        // Tareas completadas
        const [completedResult] = await db.query(
            `SELECT COUNT(*) as completed FROM tasks
            WHERE user_id = ? AND is_completed = TRUE ${dateFilter}`,
            params
        );

        // Por prioridad
        const [priorityResult] = await db.query(
            `SELECT priority, COUNT(*) as count FROM tasks
            WHERE user_id = ? ${dateFilter}
            GROUP BY priority`,
            params
        );

        // Por categoría
        const [categoryResult] = await db.query(
            `SELECT
                tc.name as category_name,
                COUNT(*) as count,
                SUM(CASE WHEN t.is_completed THEN 1 ELSE 0 END) as completed
            FROM tasks t
            LEFT JOIN task_categories tc ON t.category_id = tc.id
            WHERE t.user_id = ? ${dateFilter}
            GROUP BY tc.id, tc.name`,
            params
        );

        const completionRate = totalResult[0].total > 0
            ? (completedResult[0].completed / totalResult[0].total) * 100
            : 0;

        res.json({
            success: true,
            data: {
                total: totalResult[0].total,
                completed: completedResult[0].completed,
                pending: totalResult[0].total - completedResult[0].completed,
                completion_rate: completionRate.toFixed(2),
                by_priority: priorityResult,
                by_category: categoryResult
            }
        });

    } catch (error) {
        console.error('Error al obtener estadísticas:', error);
        res.status(500).json({
            success: false,
            message: 'Error en el servidor'
        });
    }
};
