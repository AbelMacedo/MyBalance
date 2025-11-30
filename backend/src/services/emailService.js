const nodemailer = require('nodemailer');

// Configurar transporte de email
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false, // true para 465, false para otros puertos
    auth: {
        user: process.env.SMTP_USER, // Tu email
        pass: process.env.SMTP_PASS  // Tu contraseña de aplicación
    }
});

// Verificar conexión
transporter.verify((error, success) => {
    if (error) {
        console.error('Error en configuración de email:', error);
    } else {
        console.log('Servidor de email listo');
    }
});

// Enviar email de recuperación de contraseña
exports.sendPasswordResetEmail = async (email, resetToken) => {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    const mailOptions = {
        from: `"HabitTracker" <${process.env.SMTP_USER}>`,
        to: email,
        subject: 'Recuperación de Contraseña - HabitTracker',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🔐 Recuperación de Contraseña</h1>
                    </div>
                    <div class="content">
                        <p>Hola,</p>
                        <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en HabitTracker.</p>
                        <p>Haz clic en el siguiente botón para crear una nueva contraseña:</p>
                        <center>
                            <a href="${resetUrl}" class="button">Restablecer Contraseña</a>
                        </center>
                        <p><strong>O copia y pega este enlace en tu navegador:</strong></p>
                        <p style="word-break: break-all; color: #667eea;">${resetUrl}</p>
                        <p><strong>⚠️ Este enlace expirará en 1 hora.</strong></p>
                        <p>Si no solicitaste restablecer tu contraseña, puedes ignorar este correo de forma segura.</p>
                    </div>
                    <div class="footer">
                        <p>© ${new Date().getFullYear()} HabitTracker. Todos los derechos reservados.</p>
                        <p>Este es un correo automático, por favor no respondas.</p>
                    </div>
                </div>
            </body>
            </html>
        `
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Email enviado:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error al enviar email:', error);
        throw error;
    }
};
