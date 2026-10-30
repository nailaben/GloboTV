require('dotenv').config();

const crypto = require('crypto');
const nodemailer = require('nodemailer');

const MAILJET_HOST = 'in-v3.mailjet.com';
const MAILJET_PORT = 587;
const DEFAULT_SENDER = 'GloboTV <contact.globotv@gmail.com>';

function generateOTP() {
    return String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
}

function getMailjetCredentials() {
    return {
        user: process.env.MAILJET_API_KEY || process.env.mailjetUser,
        pass: process.env.MAILJET_SECRET_KEY || process.env.mailjetPass
    };
}

async function sendOTPEmail(email, otp) {
    const { user, pass } = getMailjetCredentials();
    if (!user || !pass) {
        throw new Error('Mailjet email verification is not configured.');
    }

    const transporter = nodemailer.createTransport({
        host: MAILJET_HOST,
        port: MAILJET_PORT,
        secure: false,
        auth: { user, pass }
    });

    const from = process.env.EMAIL_FROM || DEFAULT_SENDER;
    try {
        await transporter.sendMail({
            from,
            to: email,
            subject: 'Your GloboTV verification code',
            text: `Your GloboTV verification code is ${otp}. It expires in 15 minutes.`,
            html: `<p>Your GloboTV verification code is:</p><p style="font-size:28px;font-weight:bold;letter-spacing:6px">${otp}</p><p>This code expires in 15 minutes.</p>`
        });
    } catch (error) {
        // Do not log credentials or message contents.
        console.error('Mailjet SMTP delivery failed:', error.code || 'SMTP_ERROR');
        throw new Error('Could not send the verification email. Check Mailjet credentials and the verified sender address.');
    } finally {
        transporter.close();
    }
}

module.exports = { generateOTP, sendOTPEmail };
