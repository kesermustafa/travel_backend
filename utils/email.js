import nodemailer from 'nodemailer';
import { welcomeTemplate, passwordResetTemplate } from './Emailtemplates.js';

export default class Email {

    constructor(user, url) {
        this.to = user.email;
        this.firstName = user.name.split(' ')[0];
        this.url = url;
        this.from = `Gemini App <${process.env.EMAIL_FROM}>`;
    }

    newTransport() {
        return nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            auth: {
                user: process.env.EMAIL_USERNAME,
                pass: process.env.EMAIL_PASSWORD
            }
        });
    }

    async send(subject, htmlContent) {
        const mailOptions = {
            from: this.from,
            to: this.to,
            subject,
            html: htmlContent,
            text: htmlContent.replace(/<[^>]*>/g, '')
        };

        await this.newTransport().sendMail(mailOptions);
    }

    async sendWelcome() {
        await this.send(
            'Travels Ailesine Hoş Geldin! 🎉',
            welcomeTemplate(this.firstName, this.url)
        );
    }

    async sendPasswordReset() {
        await this.send(
            'Şifre Sıfırlama Bağlantısı (10 dk geçerli)',
            passwordResetTemplate(this.url)
        );
    }
}