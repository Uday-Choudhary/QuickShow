import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config(); // Load your .env file

const transporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 587,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
    }
});

async function test() {
    console.log("Testing with User:", process.env.SMTP_USER);
    console.log("Testing with Sender:", process.env.SENDER_EMAIL);

    try {
        const info = await transporter.sendMail({
            from: process.env.SENDER_EMAIL,
            to: process.env.SENDER_EMAIL, // Send to yourself
            subject: "Test Email from Node",
            text: "If you see this, credentials are correct."
        });
        console.log("✅ Success! Message ID:", info.messageId);
    } catch (error) {
        console.error("❌ Failed:", error);
    }
}

test();