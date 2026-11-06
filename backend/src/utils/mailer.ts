/**
 * Outgoing email for LeafScan AI, sent through a Gmail account.
 *
 * Only the CAO password-reset code is emailed today, but every send
 * goes through here so the provider is configured in one place
 * (same idea as utils/sms.ts).
 *
 * If GMAIL_USER / GMAIL_APP_PASSWORD are not set, this falls back to
 * printing the message to the server console, so the "Forgot password"
 * flow works before a sender account exists: read the code from the
 * backend terminal instead of an inbox.
 */

import nodemailer, { type Transporter } from 'nodemailer';
import { env } from '../config/env';

/** True when a Gmail sender account is configured. */
export function mailIsConfigured(): boolean {
  return env.mail.user.length > 0 && env.mail.appPassword.length > 0;
}

export interface MailMessage {
  to: string;
  subject: string;
  text: string;
}

// Created on first use so a missing config costs nothing at startup.
let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: env.mail.user, pass: env.mail.appPassword },
    });
  }
  return transporter;
}

/**
 * Sends one email, or logs it when Gmail is not configured.
 *
 * Never throws for a delivery problem: callers (password reset)
 * must not reveal to the client whether an address exists or whether
 * sending happened to fail. Failures are logged server-side.
 */
export async function sendMail(message: MailMessage): Promise<void> {
  if (!mailIsConfigured()) {
    console.info(
      '\n----- EMAIL (Gmail not configured, not actually sent) -----\n' +
        `To:      ${message.to}\n` +
        `Subject: ${message.subject}\n` +
        `${message.text}\n` +
        '-----------------------------------------------------------\n'
    );
    return;
  }

  try {
    await getTransporter().sendMail({
      from: `"${env.appName}" <${env.mail.user}>`,
      to: message.to,
      subject: message.subject,
      text: message.text,
    });
  } catch (error) {
    console.error('[mail] Failed to send email to', message.to, error);
    if ((error as { code?: string }).code === 'EAUTH') {
      console.error(
        '[mail] Gmail rejected the login. GMAIL_APP_PASSWORD must be a Google App Password ' +
          '(16 letters, https://myaccount.google.com/apppasswords), not the normal Gmail password. ' +
          'Check it with: npm run test:mail'
      );
    }
  }
}
