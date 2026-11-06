/**
 * Outgoing SMS for LeafScan AI.
 *
 * Only one message is sent by the whole system today - the
 * password-reset code - but every send goes through here so the
 * provider is configured and audited in one place.
 *
 * Providers, in order of preference:
 *   1. SMS gateway - an Android phone running the free, open-source
 *      "SMS Gateway for Android" app (https://sms-gate.app). The text
 *      is sent from that phone's own SIM, so there is no service fee
 *      (the SIM's own load / unli-text is what gets used).
 *   2. Semaphore (https://semaphore.co) - a paid service.
 *   3. Neither configured: the message is printed to the server
 *      console. That keeps the "Forgot password" flow working before
 *      a gateway phone exists: read the code from the backend
 *      terminal instead of a text message.
 */

import { env } from '../config/env';

const SEMAPHORE_ENDPOINT = 'https://api.semaphore.co/api/v4/messages';

/** A phone on the LAN can be asleep or off Wi-Fi - do not wait forever. */
const GATEWAY_TIMEOUT_MS = 10_000;

/** True when the Android SMS gateway is configured. */
export function gatewayIsConfigured(): boolean {
  return (
    env.sms.gatewayUrl.length > 0 &&
    env.sms.gatewayUsername.length > 0 &&
    env.sms.gatewayPassword.length > 0
  );
}

/** True when a Semaphore API key is configured. */
export function semaphoreIsConfigured(): boolean {
  return env.sms.apiKey.trim().length > 0;
}

/**
 * Semaphore expects PH numbers as 09XXXXXXXXX. Registration also
 * accepts the +639XXXXXXXXX form, so normalize before sending.
 */
function toSemaphoreNumber(phoneNumber: string): string {
  return phoneNumber.startsWith('+63') ? `0${phoneNumber.slice(3)}` : phoneNumber;
}

/**
 * The SMS gateway wants E.164 (+639XXXXXXXXX), the opposite of
 * Semaphore. Accounts store 09XXXXXXXXX, so convert on the way out.
 */
function toE164Number(phoneNumber: string): string {
  return phoneNumber.startsWith('09') ? `+63${phoneNumber.slice(1)}` : phoneNumber;
}

export interface SmsMessage {
  to: string;
  text: string;
}

/**
 * Sends one SMS through the Android SMS gateway.
 * Throws on any failure so the caller can log it; sendSms() catches.
 */
async function sendViaGateway(message: SmsMessage): Promise<void> {
  const credentials = Buffer.from(
    `${env.sms.gatewayUsername}:${env.sms.gatewayPassword}`
  ).toString('base64');

  const response = await fetch(env.sms.gatewayUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${credentials}`,
    },
    body: JSON.stringify({
      textMessage: { text: message.text },
      phoneNumbers: [toE164Number(message.to)],
    }),
    signal: AbortSignal.timeout(GATEWAY_TIMEOUT_MS),
  });

  // The gateway answers 2xx (202 Accepted) once the phone has queued
  // the text; anything else is a real failure.
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`SMS gateway rejected the message: ${response.status} ${errorText}`);
  }
}

/** Sends one SMS through Semaphore. Throws on any failure. */
async function sendViaSemaphore(message: SmsMessage): Promise<void> {
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
    throw new Error(`Semaphore rejected the message: ${response.status} ${errorText}`);
  }
}

/**
 * Sends one SMS, or logs it when no provider is configured.
 *
 * Never throws for a delivery problem: callers (password reset)
 * must not reveal to the client whether a phone number exists or
 * whether sending happened to fail. Failures are logged server-side.
 */
export async function sendSms(message: SmsMessage): Promise<void> {
  try {
    if (gatewayIsConfigured()) {
      await sendViaGateway(message);
      return;
    }

    if (semaphoreIsConfigured()) {
      await sendViaSemaphore(message);
      return;
    }
  } catch (error) {
    console.error('[sms] Failed to send SMS to', message.to, error);
    if (error instanceof Error && error.name === 'TimeoutError') {
      console.error(
        '[sms] The gateway phone did not answer in time. Check that the phone is on, ' +
          'the SMS Gateway app is running, and the phone and this PC share one Wi-Fi. ' +
          'Check it with: npm run test:sms'
      );
    }
    return;
  }

  console.info(
    '\n----- SMS (no SMS provider configured, not actually sent) -----\n' +
      `To:      ${message.to}\n` +
      `Message: ${message.text}\n` +
      '---------------------------------------------------------------\n'
  );
}
