import nodemailer from 'nodemailer';

// Create an smpt account on brevo and add host, port and credentials.
const transporter = nodemailer.createTransport({
    host: "smtp-relay.brevo.com",
    port: 587,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

export default transporter;