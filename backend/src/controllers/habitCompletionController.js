const db = require('../config/database');

exports.completeHabit = async (req, res) => {
  try {
    const userId = req.userId;
    const { habit_id, completion_date, status, notes } = req.body;

    if (!habit_id) {
      return res.status(400).json({
        success: false,
        message: 'El ID del hábito es obligatorio'
      });
    }

    const date = completion_date || new Date().toISOString().split('T')[0];
    const time = new Date().toTimeString().split(' ')[0];

    const [habits] = await db.query(
      'SELECT id FROM habits WHERE id = ? AND user_id = ?',
      [habit_id, userId]
    );

    if (habits.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Hábito no encontrado'
      });
    }

    await db.query(
      `INSERT INTO habit_completions
            (habit_id, user_id, completion_date, completion_time, status, notes)
            VALUES (?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                completion_time = VALUES(completion_time),
                status = VALUES(status),
                notes = VALUES(notes)`,
      [habit_id, userId, date, time, status || 'completed', notes || null]
    );

    await updateStreak(habit_id, userId);

    res.json({
      success: true,
      message: 'Cumplimiento registrado exitosamente'
    });

  } catch (error) {
    console.error('Error al registrar cumplimiento:', error);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor'
    });
  }
};

exports.getHabitCompletions = async (req, res) => {
  try {
    const userId = req.userId;
    const { habit_id } = req.params;
    const { start_date, end_date } = req.query;

    let query = `
            SELECT * FROM habit_completions
            WHERE habit_id = ? AND user_id = ?
        `;
    const params = [habit_id, userId];

    if (start_date) {
      query += ' AND completion_date >= ?';
      params.push(start_date);
    }

    if (end_date) {
      query += ' AND completion_date <= ?';
      params.push(end_date);
    }

    query += ' ORDER BY completion_date DESC';

    const [completions] = await db.query(query, params);

    res.json({
      success: true,
      data: { completions }
    });

  } catch (error) {
    console.error('Error al obtener cumplimientos:', error);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor'
    });
  }
};

exports.getHabitStats = async (req, res) => {
  try {
    const userId = req.userId;
    const { habit_id } = req.params;
    const { period } = req.query;

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

    const [totalResult] = await db.query(
      `SELECT COUNT(*) as total FROM habit_completions
            WHERE habit_id = ? AND user_id = ? AND completion_date BETWEEN ? AND ?`,
      [habit_id, userId, startDate, endDate]
    );

    s
    const [statusResult] = await db.query(
      `SELECT status, COUNT(*) as count FROM habit_completions
            WHERE habit_id = ? AND user_id = ? AND completion_date BETWEEN ? AND ?
            GROUP BY status`,
      [habit_id, userId, startDate, endDate]
    );

    const [streakResult] = await db.query(
      `SELECT current_streak, longest_streak FROM habit_streaks
            WHERE habit_id = ? AND user_id = ?`,
      [habit_id, userId]
    );

    const [completionDays] = await db.query(
      `SELECT completion_date, status FROM habit_completions
            WHERE habit_id = ? AND user_id = ? AND completion_date BETWEEN ? AND ?
            ORDER BY completion_date`,
      [habit_id, userId, startDate, endDate]
    );

    res.json({
      success: true,
      data: {
        total_completions: totalResult[0].total,
        status_breakdown: statusResult,
        current_streak: streakResult[0]?.current_streak || 0,
        longest_streak: streakResult[0]?.longest_streak || 0,
        completion_days: completionDays
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

async function updateStreak(habitId, userId) {
  try {
    const [completions] = await db.query(
      `SELECT completion_date FROM habit_completions
            WHERE habit_id = ? AND user_id = ? AND status = 'completed'
            ORDER BY completion_date DESC
            LIMIT 100`,
      [habitId, userId]
    );

    if (completions.length === 0) {
      return;
    }

    let currentStreak = 1;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < completions.length - 1; i++) {
      const current = new Date(completions[i].completion_date);
      const next = new Date(completions[i + 1].completion_date);

      const diffDays = Math.floor((current - next) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        currentStreak++;
      } else {
        break;
      }
    }

    const [streakData] = await db.query(
      'SELECT longest_streak FROM habit_streaks WHERE habit_id = ? AND user_id = ?',
      [habitId, userId]
    );

    const longestStreak = Math.max(
      streakData[0]?.longest_streak || 0,
      currentStreak
    );

    await db.query(
      `UPDATE habit_streaks SET
                current_streak = ?,
                longest_streak = ?,
                last_completion_date = ?
            WHERE habit_id = ? AND user_id = ?`,
      [currentStreak, longestStreak, completions[0].completion_date, habitId, userId]
    );

  } catch (error) {
    console.error('Error al actualizar racha:', error);
  }
}
