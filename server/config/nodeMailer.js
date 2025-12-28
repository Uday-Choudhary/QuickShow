import nodemailer from 'nodemailer'


const transporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 587,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
    }
})

const sendEmail = async ({ to, subject, body, html }) => {
    try {
        const response = await transporter.sendMail({
            from: process.env.SENDER_EMAIL,
            to,
            subject,
            html: html || body
        })
        console.log("Email sent successfully", response)
        return response
    } catch (error) {
        console.log("Email error", error)
        throw error // Re-throw so Inngest knows it failed
    }

}

export default sendEmail