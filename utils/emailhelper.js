const nodemailer = require('nodemailer');
require('dotenv').config();  // Load environment variables

const sendEmail = async (options) => {
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: false,  // Use `true` for port 465, `false` for 587
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });

    const mailOptions = {
        from: `"MyApp Support" <${process.env.SMTP_USER}>`, // Sender email
        to: options.email,  // Recipient
        subject: options.subject,
        text: options.message,  // Plain text message
        html: options.html  // HTML version (optional)
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${options.email}`);
};

module.exports = sendEmail;
