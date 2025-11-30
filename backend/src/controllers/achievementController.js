const db = require('../config/database');

// RF-18: Obtener todos los logros
exports.getAchievements = async (req, res) => {
    try {
        const userId = req.userId;
        const { category } = req.query;

        let query = `
            SELECT
                a.*,
                CASE WHEN ua.id IS NOT NULL THEN TRUE ELSE FALSE END as is_unlocked,
                ua.unlocked_at
            FROM achievements a
            LEFT JOIN user_achievements ua ON a.id = ua.achievement_id AND ua.user_id = ?
            WHERE a.is_active = TRUE
        `;

        const params = [userId];

        if (category) {
            query += ' AND a.category = ?';
            params.push(category);
        }

        query += ' ORDER BY a.rarity DESC, a.points DESC';

        const [achievements] = await db.query(query, params);

        res.json({
            success: true,
            data: { achievements }
        });

    } catch (error) {
        console.error('Error al obtener logros:', error);
        res.status(500).json({
            success: false,
            message: 'Error en el servidor'
        });
    }
};

// Obtener logros desbloqueados del usuario
exports.getUserAchievements = async (req, res) => {
    try {
        const userId = req.userId;

        const [achievements] = await db.query(
            `SELECT
                a.*,
                ua.unlocked_at
            FROM user_achievements ua
            JOIN achievements a ON ua.achievement_id = a.id
            WHERE ua.user_id = ?
            ORDER BY ua.unlocked_at DESC`,
            [userId]
        );

        res.json({
            success: true,
            data: { achievements }
        });

    } catch (error) {
        console.error('Error al obtener logros del usuario:', error);
        res.status(500).json({
            success: false,
            message: 'Error en el servidor'
        });
    }
};

// Verificar y desbloquear logros automáticamente
exports.checkAndUnlockAchievements = async (userId) => {
    try {
        // Obtener logros no desbloqueados
        const [achievements] = await db.query(
            `SELECT a.* FROM achievements a
            WHERE a.is_active = TRUE
            AND a.id NOT IN (
                SELECT achievement_id FROM user_achievements WHERE user_id = ?
            )`,
            [userId]
        );

        for (const achievement of achievements) {
            let shouldUnlock = false;

            switch (achievement.requirement_type) {
                case 'complete_challenges':
                    const [challengeCount] = await db.query(
                        'SELECT COUNT(*) as count FROM user_challenges WHERE user_id = ? AND is_completed = TRUE',
                        [userId]
                    );
                    shouldUnlock = challengeCount[0].count >= achievement.requirement_value;
                    break;

                case 'habit_streak':
                    const [habitStreak] = await db.query(
                        'SELECT MAX(current_streak) as max_streak FROM habits WHERE user_id = ?',
                        [userId]
                    );
                    shouldUnlock = (habitStreak[0].max_streak || 0) >= achievement.requirement_value;
                    break;

                case 'tasks_completed':
                    const [taskCount] = await db.query(
                        'SELECT COUNT(*) as count FROM tasks WHERE user_id = ? AND is_completed = TRUE',
                        [userId]
                    );
                    shouldUnlock = taskCount[0].count >= achievement.requirement_value;
                    break;

                case 'mood_streak':
                    // Contar días consecutivos con registro de ánimo
                    const [moodStreak] = await db.query(
                        `SELECT COUNT(DISTINCT entry_date) as count
                        FROM mood_entries
                        WHERE user_id = ?
                        AND entry_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)`,
                        [userId]
                    );
                    shouldUnlock = moodStreak[0].count >= achievement.requirement_value;
                    break;
            }

            if (shouldUnlock) {
                // Desbloquear logro
                await db.query(
                    'INSERT IGNORE INTO user_achievements (user_id, achievement_id) VALUES (?, ?)',
                    [userId, achievement.id]
                );

                // Agregar puntos
                await db.query(
                    `INSERT INTO user_points (user_id, total_points) VALUES (?, ?)
                    ON DUPLICATE KEY UPDATE total_points = total_points + ?`,
                    [userId, achievement.points, achievement.points]
                );
            }
        }

    } catch (error) {
        console.error('Error al verificar logros:', error);
    }
};

// Obtener puntos y nivel del usuario
exports.getUserPoints = async (req, res) => {
    try {
        const userId = req.userId;

        let [points] = await db.query(
            'SELECT * FROM user_points WHERE user_id = ?',
            [userId]
        );

        if (points.length === 0) {
            // Crear registro inicial
            await db.query(
                'INSERT INTO user_points (user_id) VALUES (?)',
                [userId]
            );

            [points] = await db.query(
                'SELECT * FROM user_points WHERE user_id = ?',
                [userId]
            );
        }

        res.json({
            success: true,
            data: { points: points[0] }
        });

    } catch (error) {
        console.error('Error al obtener puntos:', error);
        res.status(500).json({
            success: false,
            message: 'Error en el servidor'
        });
    }
};
