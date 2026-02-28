const nodemailer = require('nodemailer');

class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
    }

    async sendEmail(options) {
        const mailOptions = {
            from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
            to: options.email,
            subject: options.subject,
            text: options.message,
            html: options.html,
        };

        const info = await this.transporter.sendMail(mailOptions);
        console.log('Message sent: %s', info.messageId);
        return info;
    }

    async sendVerificationEmail(email, token) {
        const verificationUrl = `${process.env.APP_URL}/verify-email?token=${token}&email=${email}`;

        const message = `Please verify your email by clicking the link: ${verificationUrl}`;
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                <h2 style="color: #4F46E5; text-align: center;">Verify Your Email</h2>
                <p>Hello,</p>
                <p>Thank you for registering! Please click the button below to verify your email address and activate your account. This link will expire in 30 minutes.</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${verificationUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Verify Email</a>
                </div>
                <p>If the button doesn't work, you can copy and paste the following link into your browser:</p>
                <p style="word-break: break-all; color: #6B7280;">${verificationUrl}</p>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="font-size: 12px; color: #9CA3AF; text-align: center;">If you did not request this email, please ignore it.</p>
            </div>
        `;

        try {
            return await this.sendEmail({
                email,
                subject: 'Email Verification - TaskFlow AI',
                message,
                html,
            });
        } catch (error) {
            console.warn('---------------------------------------------------------');
            console.warn('⚠️ EMAIL SENDING FAILED (SMTP not configured?)');
            console.warn(`📩 FOR TESTING, USE THIS LINK TO VERIFY:`);
            console.warn(verificationUrl);
            console.warn('---------------------------------------------------------');
            throw error;
        }
    }
}

module.exports = new EmailService();
