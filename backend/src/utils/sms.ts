/**
 * Outgoing SMS for LeafScan AI, via Semaphore (https://semaphore.co).
 *
 * Only one message is sent by the whole system today - the
 * password-reset code - but every send goes through here so the
 * provider is configured and audited in one place.
 *
 * If SEMAPHORE_API_KEY is not set, this falls back to printing the
 * message to the server console. That keeps the "Forgot password"
 * flow working before a Semaphore account exists: read the code
 * from the backend terminal instead of a text message.
 */

import { env } from '../config/env';

const SEMAPHORE_ENDPOINT = 'https://api.semaphore.co/api/v4/messages';

/** True when a Semaphore API key is configured. */
export function smsIsConfigured(): boolean {
  return env.sms.apiKey.trim().length > 0;
}

/**
 * Semaphore expects PH numbers as 09XXXXXXXXX. Registration also
 * accepts the +639XXXXXXXXX form, so normalize before sending.
 */
function toSemaphoreNumber(phoneNumber: string): string {
  return phoneNumber.startsWith('+63') ? `0${phoneNumber.slice(3)}` : phoneNumber;
}

export interface SmsMessage {
  to: string;
  text: string;
}

/**
 * Sends one SMS, or logs it when Semaphore is not configured.
 *
 * Never throws for a delivery problem: callers (password reset)
 * must not reveal to the client whether a phone number exists or
 * whether sending happened to fail. Failures are logged server-side.
 */
export async function sendSms(message: SmsMessage): Promise<void> {
  if (!smsIsConfigured()) {
    console.info(
      '\n----- SMS (Semaphore not configured, not actually sent) -----\n' +
        `To:      ${message.to}\n` +
        `Message: ${message.text}\n` +
        '---------------------------------------------------------------\n'
    );
    return;
  }

  try {
    const body = new URLSearchParams({
      apikey: env.sms.apiKey,
      number: toSemaphoreNumber(message.to),
      message: message.text,
    });

    if (env.sms.senderName) {
      body.set('sendername', env.sms.senderName);
    }

    const response = await fetch(SEMAPHORE_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[sms] Semaphore rejected the message:', response.status, errorText);
    }
  } catch (error) {
    console.error('[sms] Failed to send SMS to', message.to, error);
  }
}
