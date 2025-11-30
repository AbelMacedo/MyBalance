const db = require('../config/database');

// RF-14: Crear o actualizar balance diario
exports.saveDailyBalance = async (req, res) => {
    try {
        const userId = req.userId;
        const {
            balance_date,
            what_went_well,
            what_to_improve,
            day_rating
        } = req.body;

        // Validaciones
        if (!balance_date || !what_went_well || !what_to_improve || !day_rating) {
            return res.status(400).json({
                success: false,
                message: 'Todos los campos son obligatorios'
            });
        }

        if (day_rating < 1 || day_rating > 5) {
            return res.status(400).json({
                success: false,
                message: 'La calificación debe estar entre 1 y 5'
            });
        }

        // Insertar o actualizar (UPSERT)
        await db.query(
            `INSERT INTO daily_balances
            (user_id, balance_date, what_went_well, what_to_improve, day_rating)
            VALUES (?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                what_went_well = VALUES(what_went_well),
                what_to_improve = VALUES(what_to_improve),
                day_rating = VALUES(day_rating)`,
            [userId, balance_date, what_went_well, what_to_improve, day_rating]
        );

        res.json({
            success: true,
            message: 'Balance diario guardado exitosamente'
        });

    } catch (error) {
        console.error('Error al guardar balance:', error);
        res.status(500).json({
            success: false,
            message: 'Error en el servidor'
        });
    }
};

// Obtener balance de una fecha específica
exports.getDailyBalance = async (req, res) => {
    try {
        const userId = req.userId;
        const { date } = req.params;

        const [balances] = await db.query(
            `SELECT * FROM daily_balances
            WHERE user_id = ? AND balance_date = ?`,
            [userId, date]
        );

        if (balances.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Balance no encontrado'
            });
        }

        res.json({
            success: true,
            data: { balance: balances[0] }
        });

    } catch (error) {
        console.error('Error al obtener balance:', error);
        res.status(500).json({
            success: false,
            message: 'Error en el servidor'
        });
    }
};

// Obtener historial de balances
exports.getBalanceHistory = async (req, res) => {
    try {
        const userId = req.userId;
        const { start_date, end_date, limit = 30 } = req.query;

        let query = 'SELECT * FROM daily_balances WHERE user_id = ?';
        const params = [userId];

        if (start_date) {
            query += ' AND balance_date >= ?';
            params.push(start_date);
        }

        if (end_date) {
            query += ' AND balance_date <= ?';
            params.push(end_date);
        }

        query += ' ORDER BY balance_date DESC LIMIT ?';
        params.push(parseInt(limit));

        const [balances] = await db.query(query, params);

        // Calcular estadísticas
        const avgRating = balances.length > 0
            ? balances.reduce((sum, b) => sum + b.day_rating, 0) / balances.length
            : 0;

        res.json({
            success: true,
            data: {
                balances,
                stats: {
                    total_days: balances.length,
                    average_rating: avgRating.toFixed(2)
                }
            }
        });

    } catch (error) {
        console.error('Error al obtener historial:', error);
        res.status(500).json({
            success: false,
            message: 'Error en el servidor'
        });
    }
};

// Eliminar balance
exports.deleteBalance = async (req, res) => {
    try {
        const userId = req.userId;
        const { date } = req.params;

        const [result] = await db.query(
            'DELETE FROM daily_balances WHERE user_id = ? AND balance_date = ?',
            [userId, date]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Balance no encontrado'
            });
        }

        res.json({
            success: true,
            message: 'Balance eliminado exitosamente'
        });

    } catch (error) {
        console.error('Error al eliminar balance:', error);
        res.status(500).json({
            success: false,
            message: 'Error en el servidor'
        });
    }
};
