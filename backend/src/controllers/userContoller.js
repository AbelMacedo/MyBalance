const db = require('../config/database');
const bcrypt = require('bcryptjs');

exports.getProfile = async (req, res) => {
    try {
        const [users] = await db.query(
            'SELECT id, full_name, email, avatar_url, created_at FROM users WHERE id = ?',
            [req.userId]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        res.json({
            success: true,
            data: { user: users[0] }
        });

    } catch (error) {
        console.error('Error al obtener perfil:', error);
        res.status(500).json({
            success: false,
            message: 'Error en el servidor'
        });
    }
};

// RF-26: Actualizar perfil
exports.updateProfile = async (req, res) => {
    try {
        const { full_name, avatar_url } = req.body;

        await db.query(
            'UPDATE users SET full_name = ?, avatar_url = ? WHERE id = ?',
            [full_name, avatar_url, req.userId]
        );

        res.json({
            success: true,
            message: 'Perfil actualizado exitosamente'
        });

    } catch (error) {
        console.error('Error al actualizar perfil:', error);
        res.status(500).json({
            success: false,
            message: 'Error en el servidor'
        });
    }
};

// RF-28: Eliminar cuenta
exports.deleteAccount = async (req, res) => {
    try {
        const { password } = req.body;

        // Verificar contraseña
        const [users] = await db.query(
            'SELECT password FROM users WHERE id = ?',
            [req.userId]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        const isPasswordValid = await bcrypt.compare(password, users[0].password);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Contraseña incorrecta'
            });
        }

        // Eliminar usuario (CASCADE eliminará registros relacionados)
        await db.query('DELETE FROM users WHERE id = ?', [req.userId]);

        res.json({
            success: true,
            message: 'Cuenta eliminada permanentemente'
        });

    } catch (error) {
        console.error('Error al eliminar cuenta:', error);
        res.status(500).json({
            success: false,
            message: 'Error en el servidor'
        });
    }
};
