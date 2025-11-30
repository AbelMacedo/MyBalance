const db = require('../config/database');

// RF-17: Obtener retos disponibles
exports.getChallenges = async (req, res) => {
    try {
        const { category_id, type, difficulty } = req.query;

        let query = `
            SELECT
                c.*,
                wc.name as category_name,
                wc.icon as category_icon,
                wc.color as category_color
            FROM challenges c
            LEFT JOIN wellness_categories wc ON c.category_id = wc.id
            WHERE c.is_active = TRUE
        `;

        const params = [];

        if (category_id) {
            query += ' AND c.category_id = ?';
            params.push(category_id);
        }

        if (type) {
            query += ' AND c.type = ?';
            params.push(type);
        }

        if (difficulty) {
            query += ' AND c.difficulty = ?';
            params.push(difficulty);
        }

        query += ' ORDER BY c.difficulty, c.points DESC';

        const [challenges] = await db.query(query, params);

        res.json({
            success: true,
            data: { challenges }
        });

    } catch (error) {
        console.error('Error al obtener retos:', error);
        res.status(500).json({
            success: false,
            message: 'Error en el servidor'
        });
    }
};

// Unirse a un reto
exports.joinChallenge = async (req, res) => {
    try {
        const userId = req.userId;
        const { challenge_id } = req.body;

        if (!challenge_id) {
            return res.status(400).json({
                success: false,
                message: 'El ID del reto es obligatorio'
            });
        }

        // Verificar que el reto existe
        const [challenges] = await db.query(
            'SELECT * FROM challenges WHERE id = ? AND is_active = TRUE',
            [challenge_id]
        );

        if (challenges.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Reto no encontrado'
            });
        }

        const challenge = challenges[0];
        const startDate = new Date();
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + challenge.duration_days);

        // Verificar si ya está participando en este reto
        const [existing] = await db.query(
            `SELECT id FROM user_challenges
            WHERE user_id = ? AND challenge_id = ? AND is_completed = FALSE`,
            [userId, challenge_id]
        );

        if (existing.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Ya estás participando en este reto'
            });
        }

        // Unirse al reto
        const [result] = await db.query(
            `INSERT INTO user_challenges
            (user_id, challenge_id, start_date, end_date)
            VALUES (?, ?, ?, ?)`,
            [userId, challenge_id, startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]]
        );

        res.status(201).json({
            success: true,
            message: 'Te has unido al reto exitosamente',
            data: {
                user_challenge_id: result.insertId
            }
        });

    } catch (error) {
        console.error('Error al unirse al reto:', error);
        res.status(500).json({
            success: false,
            message: 'Error en el servidor'
        });
    }
};

// Obtener retos activos del usuario
// Obtener retos activos del usuario
exports.getUserChallenges = async (req, res) => {
    try {
        const userId = req.userId;
        const { is_completed } = req.query;

        let query = `
            SELECT
                uc.*,
                c.title,
                c.description,
                c.type,
                c.duration_days,
                c.difficulty,
                c.points,
                wc.name as category_name,
                wc.icon as category_icon,
                wc.color as category_color,
                DATEDIFF(uc.end_date, CURDATE()) as days_remaining,
                COALESCE(uc.current_streak, 0) as current_streak,
                COALESCE(uc.progress_percentage, 0) as progress_percentage
            FROM user_challenges uc
            JOIN challenges c ON uc.challenge_id = c.id
            LEFT JOIN wellness_categories wc ON c.category_id = wc.id
            WHERE uc.user_id = ?
        `;

        const params = [userId];

        if (is_completed !== undefined) {
            query += ' AND uc.is_completed = ?';
            params.push(is_completed === 'true' ? 1 : 0);
        }

        query += ' ORDER BY uc.is_completed ASC, uc.start_date DESC';

        const [userChallenges] = await db.query(query, params);

        res.json({
            success: true,
            data: { challenges: userChallenges }
        });

    } catch (error) {
        console.error('Error al obtener retos del usuario:', error);
        res.status(500).json({
            success: false,
            message: 'Error en el servidor'
        });
    }
};

// Registrar progreso diario del reto
exports.updateChallengeProgress = async (req, res) => {
    try {
        const userId = req.userId;
        const { user_challenge_id } = req.params;
        const { progress_date, is_completed, notes } = req.body;

        // Verificar que el reto pertenece al usuario
        const [userChallenges] = await db.query(
            'SELECT * FROM user_challenges WHERE id = ? AND user_id = ?',
            [user_challenge_id, userId]
        );

        if (userChallenges.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Reto no encontrado'
            });
        }

        const dateToUse = progress_date || new Date().toISOString().split('T')[0];

        // Insertar o actualizar progreso
        await db.query(
            `INSERT INTO challenge_progress
            (user_challenge_id, progress_date, is_completed, notes)
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                is_completed = VALUES(is_completed),
                notes = VALUES(notes)`,
            [user_challenge_id, dateToUse, is_completed || false, notes || null]
        );

        // Calcular progreso total
        const [progressData] = await db.query(
            `SELECT
                COUNT(*) as total_days,
                SUM(CASE WHEN is_completed THEN 1 ELSE 0 END) as completed_days
            FROM challenge_progress
            WHERE user_challenge_id = ?`,
            [user_challenge_id]
        );

        const userChallenge = userChallenges[0];
        const totalDaysRequired = Math.ceil(
            (new Date(userChallenge.end_date) - new Date(userChallenge.start_date)) / (1000 * 60 * 60 * 24)
        );

        const completedDays = progressData[0].completed_days;
        const progressPercentage = (completedDays / totalDaysRequired) * 100;

        // Actualizar progreso general
        await db.query(
            `UPDATE user_challenges
            SET current_streak = ?,
                progress_percentage = ?
            WHERE id = ?`,
            [completedDays, progressPercentage, user_challenge_id]
        );

        // Si completa el reto
        if (progressPercentage >= 100 && !userChallenge.is_completed) {
            await db.query(
                `UPDATE user_challenges
                SET is_completed = TRUE, completed_at = NOW()
                WHERE id = ?`,
                [user_challenge_id]
            );

            // Obtener puntos del reto
            const [challengeData] = await db.query(
                'SELECT points FROM challenges WHERE id = ?',
                [userChallenge.challenge_id]
            );

            if (challengeData.length > 0) {
                // Agregar puntos al usuario
                await this.addPointsToUser(userId, challengeData[0].points);
            }
        }

        res.json({
            success: true,
            message: 'Progreso actualizado',
            data: {
                progress_percentage: progressPercentage,
                is_challenge_completed: progressPercentage >= 100
            }
        });

    } catch (error) {
        console.error('Error al actualizar progreso:', error);
        res.status(500).json({
            success: false,
            message: 'Error en el servidor'
        });
    }
};

// Abandonar reto
exports.abandonChallenge = async (req, res) => {
    try {
        const userId = req.userId;
        const { user_challenge_id } = req.params;

        const [result] = await db.query(
            'DELETE FROM user_challenges WHERE id = ? AND user_id = ?',
            [user_challenge_id, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Reto no encontrado'
            });
        }

        res.json({
            success: true,
            message: 'Has abandonado el reto'
        });

    } catch (error) {
        console.error('Error al abandonar reto:', error);
        res.status(500).json({
            success: false,
            message: 'Error en el servidor'
        });
    }
};

// Función auxiliar para agregar puntos
exports.addPointsToUser = async (userId, points) => {
    try {
        // Verificar si el usuario tiene registro de puntos
        const [existing] = await db.query(
            'SELECT * FROM user_points WHERE user_id = ?',
            [userId]
        );

        if (existing.length === 0) {
            // Crear registro inicial
            await db.query(
                'INSERT INTO user_points (user_id, total_points) VALUES (?, ?)',
                [userId, points]
            );
        } else {
            const currentPoints = existing[0].total_points + points;
            const currentLevel = Math.floor(currentPoints / 100) + 1;
            const currentLevelPoints = currentPoints % 100;
            const pointsToNext = 100 - currentLevelPoints;

            await db.query(
                `UPDATE user_points
                SET total_points = ?,
                    level = ?,
                    current_level_points = ?,
                    points_to_next_level = ?
                WHERE user_id = ?`,
                [currentPoints, currentLevel, currentLevelPoints, pointsToNext, userId]
            );
        }
    } catch (error) {
        console.error('Error al agregar puntos:', error);
    }
};
