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