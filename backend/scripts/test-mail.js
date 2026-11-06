/**
 * Checks that the Gmail sender in backend/.env really works.
 *
 * The password-reset endpoints never tell the browser when an email
 * fails (so they cannot be used to probe which addresses exist), which
 * means a wrong GMAIL_APP_PASSWORD looks like "code sent" and nothing
 * arrives. Run this after changing the Gmail settings instead.
 *
 * Usage (from the backend/ folder):
 *
 *   npm run test:mail                      # sends a test mail to GMAIL_USER itself
 *   npm run test:mail -- someone@mail.com  # sends it to that address
 *
 * It never prints the password.
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const nodemailer = require('nodemailer');

const user = (process.env.GMAIL_USER || '').trim();
const pass = (process.env.GMAIL_APP_PASSWORD || '').replace(/\s+/g, '');
const to = process.argv[2] || user;
const appName = process.env.APP_NAME || 'LeafScan AI';

function fail(message) {
  console.error(`\n✖ ${message}\n`);
  process.exit(1);
}

async function main() {
  if (!user || !pass) {
    fail(
      'GMAIL_USER and/or GMAIL_APP_PASSWORD are empty in backend/.env.\n' +
        '  With them empty the server only prints reset codes to its own terminal.'
    );
  }

  // A Google App Password is exactly 16 lowercase letters. Anything else
  // (a normal Gmail password, a placeholder) is rejected by Gmail's SMTP.
  if (!/^[a-z]{16}$/.test(pass)) {
    fail(
      `GMAIL_APP_PASSWORD does not look like an App Password (it is ${pass.length} characters).\n` +
        '  An App Password is 16 lowercase letters, made at\n' +
        '  https://myaccount.google.com/apppasswords  (2-Step Verification must be on).\n' +
        '  A normal Gmail password will NOT work here.'
    );
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });

  console.log(`Logging in to Gmail as ${user} ...`);
  try {
    await transporter.verify();
  } catch (error) {
    if (error && error.code === 'EAUTH') {
      fail(
        'Gmail rejected the login (EAUTH).\n' +
          '  - GMAIL_APP_PASSWORD must be an App Password for THIS account (GMAIL_USER),\n' +
          '  - and 2-Step Verification must be on for that account.\n' +
          `  Server said: ${error.response || error.message}`
      );
    }
    fail(`Could not reach Gmail: ${error && error.message ? error.message : error}`);
  }

  console.log(`Login OK. Sending a test email to ${to} ...`);
  await transporter.sendMail({
    from: `"${appName}" <${user}>`,
    to,
    subject: `${appName}: test email`,
    text: 'If you can read this, password-reset emails from LeafScan AI will arrive.',
  });

  console.log(`\n✔ Sent. Check the inbox (and Spam) of ${to}.\n`);
}

main().catch((error) => fail(error && error.message ? error.message : String(error)));
