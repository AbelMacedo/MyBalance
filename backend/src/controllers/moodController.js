const db = require('../config/database');

// Obtener todas las emociones disponibles
exports.getEmotions = async (req, res) => {
    try {
        const [emotions] = await db.query(
            'SELECT * FROM emotions ORDER BY category, name'
        );

        res.json({
            success: true,
            data: { emotions }
        });

    } catch (error) {
        console.error('Error al obtener emociones:', error);
        res.status(500).json({
            success: false,
            message: 'Error en el servidor'
        });
    }
};

// Obtener todas las etiquetas
exports.getTags = async (req, res) => {
    try {
        const [tags] = await db.query(
            'SELECT * FROM emotion_tags ORDER BY name'
        );

        res.json({
            success: true,
            data: { tags }
        });

    } catch (error) {
        console.error('Error al obtener etiquetas:', error);
        res.status(500).json({
            success: false,
            message: 'Error en el servidor'
        });
    }
};

// RF-06 y RF-07: Crear registro emocional
exports.createMoodEntry = async (req, res) => {
    try {
        const userId = req.userId;
        const {
            emotion_id,
            intensity,
            note,
            tag_ids,
            entry_date,
            entry_time
        } = req.body;

        // Validaciones
        if (!emotion_id || !intensity) {
            return res.status(400).json({
                success: false,
                message: 'La emoción y la intensidad son obligatorias'
            });
        }

        if (intensity < 1 || intensity > 5) {
            return res.status(400).json({
                success: false,
                message: 'La intensidad debe estar entre 1 y 5'
            });
        }

        if (note && note.length > 500) {
            return res.status(400).json({
                success: false,
                message: 'La nota no puede superar los 500 caracteres'
            });
        }

        const date = entry_date || new Date().toISOString().split('T')[0];
        const time = entry_time || new Date().toTimeString().split(' ')[0];

        // Insertar registro emocional
        const [result] = await db.query(
            `INSERT INTO mood_entries
            (user_id, emotion_id, intensity, note, entry_date, entry_time)
            VALUES (?, ?, ?, ?, ?, ?)`,
            [userId, emotion_id, intensity, note || null, date, time]
        );

        const moodEntryId = result.insertId;

        // Insertar etiquetas si existen
        if (tag_ids && Array.isArray(tag_ids) && tag_ids.length > 0) {
            const tagValues = tag_ids.map(tagId => [moodEntryId, tagId]);
            await db.query(
                'INSERT INTO mood_entry_tags (mood_entry_id, tag_id) VALUES ?',
                [tagValues]
            );
        }

        res.status(201).json({
            success: true,
            message: 'Registro emocional creado exitosamente',
            data: {
                mood_entry_id: moodEntryId
            }
        });

    } catch (error) {
        console.error('Error al crear registro emocional:', error);
        res.status(500).json({
            success: false,
            message: 'Error en el servidor'
        });
    }
};

// RF-08: Obtener historial emocional
exports.getMoodEntries = async (req, res) => {
    try {
        const userId = req.userId;
        const { start_date, end_date, emotion_id, tag_id, limit = 50, offset = 0 } = req.query;

        let query = `
            SELECT
                me.*,
                e.name as emotion_name,
                e.emoji as emotion_emoji,
                e.color as emotion_color,
                e.category as emotion_category,
                GROUP_CONCAT(et.name) as tags
            FROM mood_entries me
            INNER JOIN emotions e ON me.emotion_id = e.id
            LEFT JOIN mood_entry_tags met ON me.id = met.mood_entry_id
            LEFT JOIN emotion_tags et ON met.tag_id = et.id
            WHERE me.user_id = ?
        `;

        const params = [userId];

        // Filtros opcionales
        if (start_date) {
            query += ' AND me.entry_date >= ?';
            params.push(start_date);
        }

        if (end_date) {
            query += ' AND me.entry_date <= ?';
            params.push(end_date);
        }

        if (emotion_id) {
            query += ' AND me.emotion_id = ?';
            params.push(emotion_id);
        }

        if (tag_id) {
            query += ' AND met.tag_id = ?';
            params.push(tag_id);
        }

        query += ' GROUP BY me.id ORDER BY me.entry_date DESC, me.entry_time DESC';
        query += ' LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));

        const [entries] = await db.query(query, params);

        res.json({
            success: true,
            data: {
                entries: entries.map(entry => ({
                    ...entry,
                    tags: entry.tags ? entry.tags.split(',') : []
                }))
            }
        });

    } catch (error) {
        console.error('Error al obtener registros emocionales:', error);
        res.status(500).json({
            success: false,
            message: 'Error en el servidor'
        });
    }
};

// Obtener un registro específico
exports.getMoodEntryById = async (req, res) => {
    try {
        const userId = req.userId;
        const { id } = req.params;

        const [entries] = await db.query(
            `SELECT
                me.*,
                e.name as emotion_name,
                e.emoji as emotion_emoji,
                e.color as emotion_color,
                e.category as emotion_category,
                GROUP_CONCAT(et.id) as tag_ids,
                GROUP_CONCAT(et.name) as tag_names
            FROM mood_entries me
            INNER JOIN emotions e ON me.emotion_id = e.id
            LEFT JOIN mood_entry_tags met ON me.id = met.mood_entry_id
            LEFT JOIN emotion_tags et ON met.tag_id = et.id
            WHERE me.id = ? AND me.user_id = ?
            GROUP BY me.id`,
            [id, userId]
        );

        if (entries.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Registro no encontrado'
            });
        }

        const entry = {
            ...entries[0],
            tag_ids: entries[0].tag_ids ? entries[0].tag_ids.split(',').map(Number) : [],
            tag_names: entries[0].tag_names ? entries[0].tag_names.split(',') : []
        };

        res.json({
            success: true,
            data: { entry }
        });

    } catch (error) {
        console.error('Error al obtener registro:', error);
        res.status(500).json({
            success: false,
            message: 'Error en el servidor'
        });
    }
};

// Actualizar registro emocional
exports.updateMoodEntry = async (req, res) => {
    try {
        const userId = req.userId;
        const { id } = req.params;
        const { emotion_id, intensity, note, tag_ids } = req.body;

        // Verificar que el registro pertenece al usuario
        const [entries] = await db.query(
            'SELECT id FROM mood_entries WHERE id = ? AND user_id = ?',
            [id, userId]
        );

        if (entries.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Registro no encontrado'
            });
        }

        // Validar intensidad si se proporciona
        if (intensity && (intensity < 1 || intensity > 5)) {
            return res.status(400).json({
                success: false,
                message: 'La intensidad debe estar entre 1 y 5'
            });
        }

        // Validar longitud de nota
        if (note && note.length > 500) {
            return res.status(400).json({
                success: false,
                message: 'La nota no puede superar los 500 caracteres'
            });
        }

        // Actualizar registro
        await db.query(
            `UPDATE mood_entries SET
                emotion_id = COALESCE(?, emotion_id),
                intensity = COALESCE(?, intensity),
                note = COALESCE(?, note)
            WHERE id = ? AND user_id = ?`,
            [emotion_id, intensity, note, id, userId]
        );

        // Actualizar etiquetas si se proporcionan
        if (tag_ids !== undefined && Array.isArray(tag_ids)) {
            // Eliminar etiquetas existentes
            await db.query(
                'DELETE FROM mood_entry_tags WHERE mood_entry_id = ?',
                [id]
            );

            // Insertar nuevas etiquetas
            if (tag_ids.length > 0) {
                const tagValues = tag_ids.map(tagId => [id, tagId]);
                await db.query(
                    'INSERT INTO mood_entry_tags (mood_entry_id, tag_id) VALUES ?',
                    [tagValues]
                );
            }
        }

        res.json({
            success: true,
            message: 'Registro actualizado exitosamente'
        });

    } catch (error) {
        console.error('Error al actualizar registro:', error);
        res.status(500).json({
            success: false,
            message: 'Error en el servidor'
        });
    }
};

// Eliminar registro emocional
exports.deleteMoodEntry = async (req, res) => {
    try {
        const userId = req.userId;
        const { id } = req.params;

        // Verificar que el registro pertenece al usuario
        const [entries] = await db.query(
            'SELECT id FROM mood_entries WHERE id = ? AND user_id = ?',
            [id, userId]
        );

        if (entries.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Registro no encontrado'
            });
        }

        // Eliminar registro (CASCADE eliminará las etiquetas)
        await db.query(
            'DELETE FROM mood_entries WHERE id = ?',
            [id]
        );

        res.json({
            success: true,
            message: 'Registro eliminado exitosamente'
        });

    } catch (error) {
        console.error('Error al eliminar registro:', error);
        res.status(500).json({
            success: false,
            message: 'Error en el servidor'
        });
    }
};

// RF-09: Obtener tendencias emocionales
exports.getMoodTrends = async (req, res) => {
    try {
        const userId = req.userId;
        const { period = 'month' } = req.query; // 'week', 'month', 'year'

        // Calcular fechas
        let startDate;
        const endDate = new Date().toISOString().split('T')[0];

        switch (period) {
            case 'week':
                startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                break;
            case 'month':
                startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                break;
            case 'year':
                startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                break;
            default:
                startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        }

        // Contar emociones por categoría
        const [categoryStats] = await db.query(
            `SELECT
                e.category,
                COUNT(*) as count,
                AVG(me.intensity) as avg_intensity
            FROM mood_entries me
            INNER JOIN emotions e ON me.emotion_id = e.id
            WHERE me.user_id = ? AND me.entry_date BETWEEN ? AND ?
            GROUP BY e.category`,
            [userId, startDate, endDate]
        );

        // Emociones más frecuentes
        const [topEmotions] = await db.query(
            `SELECT
                e.name,
                e.emoji,
                e.color,
                e.category,
                COUNT(*) as count
            FROM mood_entries me
            INNER JOIN emotions e ON me.emotion_id = e.id
            WHERE me.user_id = ? AND me.entry_date BETWEEN ? AND ?
            GROUP BY e.id
            ORDER BY count DESC
            LIMIT 5`,
            [userId, startDate, endDate]
        );

        // Tendencia por día
        const [dailyTrend] = await db.query(
            `SELECT
                me.entry_date,
                e.category,
                AVG(me.intensity) as avg_intensity,
                COUNT(*) as count
            FROM mood_entries me
            INNER JOIN emotions e ON me.emotion_id = e.id
            WHERE me.user_id = ? AND me.entry_date BETWEEN ? AND ?
            GROUP BY me.entry_date, e.category
            ORDER BY me.entry_date`,
            [userId, startDate, endDate]
        );

        // Calcular promedio general
        const [avgData] = await db.query(
            `SELECT AVG(intensity) as average_intensity
            FROM mood_entries
            WHERE user_id = ? AND entry_date BETWEEN ? AND ?`,
            [userId, startDate, endDate]
        );

        res.json({
            success: true,
            data: {
                period,
                start_date: startDate,
                end_date: endDate,
                category_stats: categoryStats,
                top_emotions: topEmotions,
                daily_trend: dailyTrend,
                average_intensity: avgData[0]?.average_intensity || 0
            }
        });

    } catch (error) {
        console.error('Error al obtener tendencias:', error);
        res.status(500).json({
            success: false,
            message: 'Error en el servidor'
        });
    }
};

// RF-10: Termómetro emocional (promedio semanal)
exports.getWeeklyMoodScore = async (req, res) => {
    try {
        const userId = req.userId;

        // Semana actual
        const endDate = new Date().toISOString().split('T')[0];
        const startDateCurrent = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        // Semana anterior
        const endDatePrevious = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const startDatePrevious = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        // Promedio semana actual
        const [currentWeek] = await db.query(
            `SELECT
                AVG(me.intensity) as avg_intensity,
                e.category,
                COUNT(*) as count
            FROM mood_entries me
            INNER JOIN emotions e ON me.emotion_id = e.id
            WHERE me.user_id = ? AND me.entry_date BETWEEN ? AND ?
            GROUP BY e.category`,
            [userId, startDateCurrent, endDate]
        );

        // Promedio semana anterior
        const [previousWeek] = await db.query(
            `SELECT AVG(intensity) as avg_intensity
            FROM mood_entries
            WHERE user_id = ? AND entry_date BETWEEN ? AND ?`,
            [userId, startDatePrevious, endDatePrevious]
        );

        const currentScore = currentWeek.reduce((sum, item) => sum + parseFloat(item.avg_intensity || 0), 0) / (currentWeek.length || 1);
        const previousScore = previousWeek[0]?.avg_intensity || 0;
        const difference = currentScore - previousScore;

        res.json({
            success: true,
            data: {
                current_week: {
                    score: currentScore.toFixed(2),
                    breakdown: currentWeek
                },
                previous_week: {
                    score: parseFloat(previousScore).toFixed(2)
                },
                difference: difference.toFixed(2),
                trend: difference > 0 ? 'up' : difference < 0 ? 'down' : 'stable'
            }
        });

    } catch (error) {
        console.error('Error al obtener termómetro emocional:', error);
        res.status(500).json({
            success: false,
            message: 'Error en el servidor'
        });
    }
};
