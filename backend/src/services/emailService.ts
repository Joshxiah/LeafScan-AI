// backend/src/services/emailService.ts
// Sends emails through the Brevo HTTP API (port 443).
// Replaces Nodemailer/SMTP, which was not delivering OTP codes.

const BREVO_URL = 'https://api.brevo.com/v3/smtp/email';

function getConfig() {
  const apiKey = process.env.BREVO_API_KEY;
  const fromEmail = process.env.MAIL_FROM_EMAIL;
  const fromName = process.env.MAIL_FROM_NAME || 'LeafScan AI';

  if (!apiKey || !fromEmail) {
    throw new Error(
      'Email is not configured. Set BREVO_API_KEY and MAIL_FROM_EMAIL in backend/.env'
    );
  }
  return { apiKey, fromEmail, fromName };
}

interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export async function sendEmail({ to, subject, html, text }: SendEmailInput): Promise<void> {
  const { apiKey, fromEmail, fromName } = getConfig();

  const response = await fetch(BREVO_URL, {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      sender: { name: fromName, email: fromEmail },
      to: [{ email: to }],
      subject,
      htmlContent: html,
      textContent: text,
    }),
    signal: AbortSignal.timeout(15000), // stop waiting after 15 seconds
  });

  if (!response.ok) {
    const details = await response.text();
    // Logged on the server only — never sent to the client
    console.error(`[emailService] Brevo error ${response.status}: ${details}`);
    throw new Error('Failed to send email');
  }
}

export async function sendPasswordResetEmail(
  to: string,
  code: string,
  ttlMinutes = 15 // keep equal to PASSWORD_RESET_TTL_MINUTES; callers should pass env.passwordResetTtlMinutes
): Promise<void> {
  const subject = 'LeafScan AI password reset code';
  const text =
    `Your LeafScan AI password reset code is: ${code}\n\n` +
    `This code expires in ${ttlMinutes} minutes. If you did not request a password reset, ignore this email.`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 24px;">
      <h2 style="color: #166534; margin-top: 0;">LeafScan AI</h2>
      <p>Your password reset code is:</p>
      <p style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #166534;">${code}</p>
      <p>This code expires in ${ttlMinutes} minutes.</p>
      <p style="color: #6b7280; font-size: 13px;">
        If you did not request a password reset, you can ignore this email.
      </p>
    </div>`;

  await sendEmail({ to, subject, html, text });
}
