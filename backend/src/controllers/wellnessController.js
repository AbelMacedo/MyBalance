const db = require('../config/database');

// Obtener categorías de bienestar
exports.getCategories = async (req, res) => {
    try {
        const [categories] = await db.query(
            'SELECT * FROM wellness_categories ORDER BY name'
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

// RF-16: Obtener consejos de bienestar
exports.getTips = async (req, res) => {
    try {
        const { category_id, difficulty, limit = 10 } = req.query;

        let query = `
            SELECT
                wt.*,
                wc.name as category_name,
                wc.icon as category_icon,
                wc.color as category_color
            FROM wellness_tips wt
            LEFT JOIN wellness_categories wc ON wt.category_id = wc.id
            WHERE wt.is_active = TRUE
        `;

        const params = [];

        if (category_id) {
            query += ' AND wt.category_id = ?';
            params.push(category_id);
        }

        if (difficulty) {
            query += ' AND wt.difficulty = ?';
            params.push(difficulty);
        }

        query += ' ORDER BY RAND() LIMIT ?';
        params.push(parseInt(limit));

        const [tips] = await db.query(query, params);

        res.json({
            success: true,
            data: { tips }
        });

    } catch (error) {
        console.error('Error al obtener consejos:', error);
        res.status(500).json({
            success: false,
            message: 'Error en el servidor'
        });
    }
};

// Obtener un consejo aleatorio del día
exports.getDailyTip = async (req, res) => {
    try {
        const [tips] = await db.query(
            `SELECT
                wt.*,
                wc.name as category_name,
                wc.icon as category_icon,
                wc.color as category_color
            FROM wellness_tips wt
            LEFT JOIN wellness_categories wc ON wt.category_id = wc.id
            WHERE wt.is_active = TRUE
            ORDER BY RAND()
            LIMIT 1`
        );

        if (tips.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No hay consejos disponibles'
            });
        }

        res.json({
            success: true,
            data: { tip: tips[0] }
        });

    } catch (error) {
        console.error('Error al obtener consejo del día:', error);
        res.status(500).json({
            success: false,
            message: 'Error en el servidor'
        });
    }
};
