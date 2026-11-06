/**
 * Checks that the Android SMS gateway in backend/.env really works.
 *
 * The password-reset endpoint never tells the app when a text fails (so
 * it cannot be used to probe which numbers are registered), which means
 * a wrong gateway setting looks like "code sent" and nothing arrives.
 * Run this after changing the SMS settings instead.
 *
 * Usage (from the backend/ folder):
 *
 *   npm run test:sms -- 09171234567
 *
 * The number is who receives the test text. It never prints the password.
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const url = (process.env.SMS_GATEWAY_URL || '').trim();
const username = (process.env.SMS_GATEWAY_USERNAME || '').trim();
const password = (process.env.SMS_GATEWAY_PASSWORD || '').trim();
const to = (process.argv[2] || '').trim();
const appName = process.env.APP_NAME || 'LeafScan AI';

function fail(message) {
  console.error(`\n✖ ${message}\n`);
  process.exit(1);
}

async function main() {
  if (!url || !username || !password) {
    fail(
      'SMS_GATEWAY_URL, SMS_GATEWAY_USERNAME and/or SMS_GATEWAY_PASSWORD are empty in backend/.env.\n' +
        '  With them empty the server only prints reset codes to its own terminal.'
    );
  }

  if (!/^(09\d{9}|\+639\d{9})$/.test(to)) {
    fail('Give the number to text as an argument, e.g.  npm run test:sms -- 09171234567');
  }

  const e164 = to.startsWith('09') ? `+63${to.slice(1)}` : to;

  console.log(`Sending a test text to ${e164} through ${url} ...`);

  let response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`,
      },
      body: JSON.stringify({
        textMessage: { text: `${appName}: test message. If you can read this, reset codes will arrive.` },
        phoneNumbers: [e164],
      }),
      signal: AbortSignal.timeout(10000),
    });
  } catch (error) {
    if (error && error.name === 'TimeoutError') {
      fail(
        'The phone did not answer within 10 seconds.\n' +
          '  - Is the phone on, with the SMS Gateway app open and the server switched ON?\n' +
          '  - Local Server mode: the phone and this PC must be on the SAME Wi-Fi.\n' +
          '  - Is the IP in SMS_GATEWAY_URL the one the app shows? (It changes if the router reassigns it.)'
      );
    }
    fail(`Could not reach the gateway: ${error && error.message ? error.message : error}`);
  }

  const body = await response.text();

  if (response.status === 401) {
    fail('The gateway rejected the username/password (401). Copy them again from the app.');
  }

  if (!response.ok) {
    fail(`The gateway answered ${response.status}: ${body}`);
  }

  console.log(`\n✔ Gateway accepted it (${response.status}). The phone should text ${e164} within seconds.`);
  console.log('  If nothing arrives, open the app on the phone and check its message list for the error.\n');
}

main().catch((error) => fail(error && error.message ? error.message : String(error)));
