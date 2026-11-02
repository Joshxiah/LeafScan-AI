import nodemailer from 'nodemailer';

// Created inside the function so .env is already loaded when it runs
function getTransporter() {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!user || !pass) {
    throw new Error('SMTP_USER or SMTP_PASS is missing in backend/.env');
  }
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });
}

export async function sendResetCodeEmail(to: string, code: string): Promise<void> {
  const transporter = getTransporter();
  await transporter.sendMail({
    from: `"LeafScan AI - CAO Pagadian" <${process.env.SMTP_USER}>`,
    to,
    subject: 'Your LeafScan AI password reset code',
    text: `Your LeafScan AI password reset code is ${code}. It expires in 10 minutes. If you did not request this, you can ignore this email.`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px">
        <h2 style="color:#1f4d23;margin:0 0 12px">LeafScan AI</h2>
        <p>Use this code to reset your password:</p>
        <p style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#2e7d32;margin:16px 0">${code}</p>
        <p>This code expires in <b>10 minutes</b>.</p>
        <p style="color:#777;font-size:12px">If you did not request a password reset, you can ignore this email.</p>
      </div>`,
  });
}