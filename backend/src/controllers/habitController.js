const db = require('../config/database');

exports.createHabit = async (req, res) => {
  try {
    const userId = req.userId;
    const {
      name,
      description,
      icon,
      category_id,
      frequency,
      specific_days,
      priority,
      target_count
    } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'El nombre del hábito es obligatorio'
      });
    }

    const [result] = await db.query(
      `INSERT INTO habits
            (user_id, name, description, icon, category_id, frequency, specific_days, priority, target_count)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        name,
        description || null,
        icon || 'checkmark-circle',
        category_id || null,
        frequency || 'daily',
        specific_days ? JSON.stringify(specific_days) : null,
        priority || 'medium',
        target_count || 1
      ]
    );

    await db.query(
      'INSERT INTO habit_streaks (habit_id, user_id) VALUES (?, ?)',
      [result.insertId, userId]
    );

    res.status(201).json({
      success: true,
      message: 'Hábito creado exitosamente',
      data: {
        habit_id: result.insertId
      }
    });

  } catch (error) {
    console.error('Error al crear hábito:', error);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor'
    });
  }
};

exports.getHabits = async (req, res) => {
  try {
    const userId = req.userId;
    const { is_active } = req.query;

    let query = `
            SELECT
                h.*,
                hc.name as category_name,
                hc.icon as category_icon,
                hc.color as category_color,
                hs.current_streak,
                hs.longest_streak,
                hs.last_completion_date
            FROM habits h
            LEFT JOIN habit_categories hc ON h.category_id = hc.id
            LEFT JOIN habit_streaks hs ON h.id = hs.habit_id
            WHERE h.user_id = ?
        `;

    const params = [userId];

    if (is_active !== undefined) {
      query += ' AND h.is_active = ?';
      params.push(is_active === 'true' ? 1 : 0);
    }

    query += ' ORDER BY h.priority DESC, h.created_at DESC';

    const [habits] = await db.query(query, params);

    const habitsFormatted = habits.map(habit => ({
      ...habit,
      specific_days: habit.specific_days ? JSON.parse(habit.specific_days) : null
    }));

    res.json({
      success: true,
      data: { habits: habitsFormatted }
    });

  } catch (error) {
    console.error('Error al obtener hábitos:', error);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor'
    });
  }
};

exports.getHabitById = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const [habits] = await db.query(
      `SELECT
                h.*,
                hc.name as category_name,
                hc.icon as category_icon,
                hc.color as category_color,
                hs.current_streak,
                hs.longest_streak,
                hs.last_completion_date
            FROM habits h
            LEFT JOIN habit_categories hc ON h.category_id = hc.id
            LEFT JOIN habit_streaks hs ON h.id = hs.habit_id
            WHERE h.id = ? AND h.user_id = ?`,
      [id, userId]
    );

    if (habits.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Hábito no encontrado'
      });
    }

    const habit = {
      ...habits[0],
      specific_days: habits[0].specific_days ? JSON.parse(habits[0].specific_days) : null
    };

    res.json({
      success: true,
      data: { habit }
    });

  } catch (error) {
    console.error('Error al obtener hábito:', error);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor'
    });
  }
};

exports.updateHabit = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const {
      name,
      description,
      icon,
      category_id,
      frequency,
      specific_days,
      priority,
      target_count,
      is_active,
      is_paused
    } = req.body;

    const [habits] = await db.query(
      'SELECT id FROM habits WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (habits.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Hábito no encontrado'
      });
    }

    await db.query(
      `UPDATE habits SET
                name = COALESCE(?, name),
                description = COALESCE(?, description),
                icon = COALESCE(?, icon),
                category_id = COALESCE(?, category_id),
                frequency = COALESCE(?, frequency),
                specific_days = COALESCE(?, specific_days),
                priority = COALESCE(?, priority),
                target_count = COALESCE(?, target_count),
                is_active = COALESCE(?, is_active),
                is_paused = COALESCE(?, is_paused)
            WHERE id = ? AND user_id = ?`,
      [
        name,
        description,
        icon,
        category_id,
        frequency,
        specific_days ? JSON.stringify(specific_days) : null,
        priority,
        target_count,
        is_active,
        is_paused,
        id,
        userId
      ]
    );

    res.json({
      success: true,
      message: 'Hábito actualizado exitosamente'
    });

  } catch (error) {
    console.error('Error al actualizar hábito:', error);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor'
    });
  }
};

exports.deleteHabit = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const { preserve_history } = req.query;

    const [habits] = await db.query(
      'SELECT id FROM habits WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (habits.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Hábito no encontrado'
      });
    }

    if (preserve_history === 'true') {
      await db.query(
        'UPDATE habits SET is_active = FALSE WHERE id = ?',
        [id]
      );
    } else {
      await db.query(
        'DELETE FROM habits WHERE id = ?',
        [id]
      );
    }

    res.json({
      success: true,
      message: 'Hábito eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error al eliminar hábito:', error);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor'
    });
  }
};

exports.togglePauseHabit = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const [habits] = await db.query(
      'SELECT is_paused FROM habits WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (habits.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Hábito no encontrado'
      });
    }

    const newPausedState = !habits[0].is_paused;

    await db.query(
      'UPDATE habits SET is_paused = ? WHERE id = ?',
      [newPausedState, id]
    );

    res.json({
      success: true,
      message: `Hábito ${newPausedState ? 'pausado' : 'reanudado'} exitosamente`,
      data: { is_paused: newPausedState }
    });

  } catch (error) {
    console.error('Error al pausar/reanudar hábito:', error);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor'
    });
  }
};

exports.getCategories = async (req, res) => {
  try {
    const [categories] = await db.query(
      'SELECT * FROM habit_categories ORDER BY name'
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
