const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

const generateToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });
};

exports.register = async (req, res) => {
    try {
        const { full_name, email, password, password_confirmation } = req.body;

        // Validaciones
        if (!full_name || !email || !password || !password_confirmation) {
            return res.status(400).json({
                success: false,
                message: 'Todos los campos son obligatorios'
            });
        }

        // Validar formato email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Formato de email inválido'
            });
        }

        // Validar longitud contraseña
        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message: 'La contraseña debe tener al menos 8 caracteres'
            });
        }

        // Confirmar contraseñas coinciden
        if (password !== password_confirmation) {
            return res.status(400).json({
                success: false,
                message: 'Las contraseñas no coinciden'
            });
        }

        // Verificar si el email ya existe
        const [existingUser] = await db.query(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );

        if (existingUser.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'El email ya está registrado'
            });
        }

        // Hashear contraseña
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insertar usuario
        const [result] = await db.query(
            'INSERT INTO users (full_name, email, password) VALUES (?, ?, ?)',
            [full_name, email, hashedPassword]
        );

        const token = generateToken(result.insertId);

        res.status(201).json({
            success: true,
            message: 'Usuario registrado exitosamente',
            data: {
                user: {
                    id: result.insertId,
                    full_name,
                    email
                },
                token
            }
        });

    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({
            success: false,
            message: 'Error en el servidor'
        });
    }
};

// RF-24: Inicio de sesión
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email y contraseña son obligatorios'
            });
        }

        // Buscar usuario
        const [users] = await db.query(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Email o contraseña incorrectos'
            });
        }

        const user = users[0];

        // Verificar contraseña
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Email o contraseña incorrectos'
            });
        }

        const token = generateToken(user.id);

        res.json({
            success: true,
            message: 'Inicio de sesión exitoso',
            data: {
                user: {
                    id: user.id,
                    full_name: user.full_name,
                    email: user.email,
                    avatar_url: user.avatar_url,
                    created_at: user.created_at
                },
                token
            }
        });

    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({
            success: false,
            message: 'Error en el servidor'
        });
    }
};

// RF-25: Solicitar recuperación de contraseña
exports.requestPasswordReset = async (req, res) => {
    try {
        const { email } = req.body;

        const [users] = await db.query(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );

        // Por seguridad, siempre devolvemos el mismo mensaje
        const message = 'Si el email existe, recibirás instrucciones para restablecer tu contraseña';

        if (users.length === 0) {
            return res.json({ success: true, message });
        }

        const userId = users[0].id;
        const resetToken = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '1h' });
        const expiresAt = new Date(Date.now() + 3600000); // 1 hora

        await db.query(
            'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
            [userId, resetToken, expiresAt]
        );

        // Aquí integrarías servicio de email (NodeMailer, SendGrid, etc.)
        console.log('Token de recuperación:', resetToken);

        res.json({ success: true, message });

    } catch (error) {
        console.error('Error en solicitud reset:', error);
        res.status(500).json({
            success: false,
            message: 'Error en el servidor'
        });
    }
};

// RF-25: Restablecer contraseña
exports.resetPassword = async (req, res) => {
    try {
        const { token, new_password, new_password_confirmation } = req.body;

        if (new_password.length < 8) {
            return res.status(400).json({
                success: false,
                message: 'La contraseña debe tener al menos 8 caracteres'
            });
        }

        if (new_password !== new_password_confirmation) {
            return res.status(400).json({
                success: false,
                message: 'Las contraseñas no coinciden'
            });
        }

        // Verificar token
        const [tokens] = await db.query(
            'SELECT * FROM password_reset_tokens WHERE token = ? AND used = FALSE AND expires_at > NOW()',
            [token]
        );

        if (tokens.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Token inválido o expirado'
            });
        }

        const resetToken = tokens[0];
        const hashedPassword = await bcrypt.hash(new_password, 10);

        // Actualizar contraseña
        await db.query(
            'UPDATE users SET password = ? WHERE id = ?',
            [hashedPassword, resetToken.user_id]
        );

        // Marcar token como usado
        await db.query(
            'UPDATE password_reset_tokens SET used = TRUE WHERE id = ?',
            [resetToken.id]
        );

        res.json({
            success: true,
            message: 'Contraseña restablecida exitosamente'
        });

    } catch (error) {
        console.error('Error en reset password:', error);
        res.status(500).json({
            success: false,
            message: 'Error en el servidor'
        });
    }
};
