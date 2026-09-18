/**
 * MySQL connection pool for LeafScan AI.
 *
 * A "pool" keeps a small set of open connections ready to reuse.
 * Opening a fresh connection for every request would be slow and
 * would eventually exhaust the database server.
 */

import mysql from 'mysql2/promise';
import { env } from './env';

export const pool = mysql.createPool({
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  password: env.db.password,
  database: env.db.database,

  // Wait for a free connection instead of failing immediately
  waitForConnections: true,

  // Maximum simultaneous connections. 10 is plenty for this system.
  connectionLimit: 10,

  // 0 means an unlimited queue of waiting requests
  queueLimit: 0,

  // Return DECIMAL columns as JavaScript numbers rather than strings.
  // Without this, confidence_score would arrive as "87.50" (text).
  decimalNumbers: true,

  // Use UTC internally; we format dates for display in the frontend
  timezone: 'Z',
});

/**
 * `timezone: 'Z'` above only tells the DRIVER to treat whatever raw
 * datetime string MySQL sends back as already being UTC - it does
 * NOT touch MySQL's own session clock. That session defaults to
 * `time_zone = 'SYSTEM'`, i.e. whichever local zone the DB server's
 * OS is set to (Philippine time in this project). Left alone, a
 * TIMESTAMP column like detections.detected_at comes back as a
 * local wall-clock string mislabeled as UTC - e.g. an 8:09 PM scan
 * is misread as 8:09 PM *UTC*, which is 4:09 AM the NEXT calendar
 * day on the phone. That is enough to drop the scan out of every
 * "last 7 days" window (Home's Scan Activity chart, the CAO report
 * summary) while it still shows up in a plain, unfiltered list like
 * Recent Scans - exactly the "0 total scans but 2 in Recent Scans"
 * symptom this fixes.
 *
 * Setting the SESSION to UTC on every new physical connection makes
 * the driver's assumption actually true, so every TIMESTAMP in the
 * app (detected_at, reviewed_at, created_at...) round-trips as the
 * real moment it happened, not shifted by the server's local offset.
 */
pool.on('connection', (connection) => {
  connection.query("SET time_zone = '+00:00'");
});

/**
 * Runs a simple query to confirm the database is reachable.
 * Called once when the server starts, so a misconfiguration is
 * obvious immediately instead of on a farmer's first scan.
 */
export async function testDatabaseConnection(): Promise<void> {
  const connection = await pool.getConnection();

  try {
    await connection.query('SELECT 1');
  } finally {
    // ALWAYS return the connection to the pool, even if the
    // query threw an error. Otherwise the pool leaks and the
    // server freezes after 10 failed requests.
    connection.release();
  }
}

/**
 * Closes every connection cleanly. Called when the server shuts down.
 */
export async function closeDatabasePool(): Promise<void> {
  await pool.end();
}