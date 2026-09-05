/**
 * Reset the CAO admin password from the command line.
 *
 * The /api/auth/register endpoint only creates farmer accounts, so
 * if the single admin login is ever lost there is no in-app way to
 * recover it. This script is that recovery path.
 *
 * Usage (run from the backend/ folder):
 *
 *   node scripts/reset-admin-password.js "NewPassword123"
 *
 * With no argument it falls back to DEFAULT_PASSWORD below, which is
 * also the value recorded in database/seed_admin.sql.
 *
 * It reads the database connection from backend/.env, so it talks to
 * exactly the same MySQL the API uses.
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');

// Keep this in sync with the comment in database/seed_admin.sql.
const DEFAULT_PASSWORD = 'LeafScan@2026';
const ADMIN_USERNAME = 'admins';
const SALT_ROUNDS = 12; // must match backend/src/utils/password.ts

async function main() {
  const newPassword = process.argv[2] || DEFAULT_PASSWORD;

  if (newPassword.length < 8) {
    console.error('Password must be at least 8 characters.');
    process.exit(1);
  }

  const hash = await bcrypt.hash(newPassword, SALT_ROUNDS);

  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'leafscan_ai',
  });

  try {
    const [result] = await pool.query(
      "UPDATE users SET password_hash = ? WHERE username = ? AND role = 'admin'",
      [hash, ADMIN_USERNAME]
    );

    if (result.affectedRows === 0) {
      console.error(
        `No admin row with username "${ADMIN_USERNAME}". ` +
          'Run database/seed_admin.sql first.'
      );
      process.exit(1);
    }

    // Confirm the new password verifies against what was just stored.
    const [[row]] = await pool.query(
      'SELECT password_hash FROM users WHERE username = ? LIMIT 1',
      [ADMIN_USERNAME]
    );
    const ok = await bcrypt.compare(newPassword, row.password_hash);

    console.log('Admin password reset.');
    console.log(`  username: ${ADMIN_USERNAME}`);
    console.log(`  password: ${newPassword}`);
    console.log(`  verified: ${ok}`);
    console.log(`  hash:     ${hash}`);
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
