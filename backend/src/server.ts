/**
 * Entry point for the LeafScan AI backend.
 *
 * Responsibilities:
 *   1. Verify the database is reachable BEFORE accepting traffic
 *   2. Start listening for requests
 *   3. Shut down cleanly when stopped
 */

import app from './app';
import { env } from './config/env';
import { testDatabaseConnection, closeDatabasePool } from './config/database';
import { ensureUploadDirectoryExists } from './middleware/upload.middleware';

async function startServer(): Promise<void> {
  try {
    // ---------- 0. Make sure uploads/ exists ----------
    ensureUploadDirectoryExists();

    // ---------- 1. Check the database first ----------
    console.log('Connecting to MySQL database...');
    await testDatabaseConnection();
    console.log(`Connected to database "${env.db.database}" on ${env.db.host}:${env.db.port}`);

    // ---------- 2. Start listening ----------
    // '0.0.0.0' means "accept connections from any network
    // interface". Without it the server would only answer
    // requests from this computer, and your PHONE could never
    // reach it in Phase 7.
    const server = app.listen(env.port, '0.0.0.0', () => {
      console.log('');
      console.log('============================================');
      console.log('   LeafScan AI Backend');
      console.log('============================================');
      console.log(`   Environment : ${env.nodeEnv}`);
      console.log(`   Local URL   : http://localhost:${env.port}`);
      console.log(`   Health check: http://localhost:${env.port}/api/health`);
      console.log(`   DB check    : http://localhost:${env.port}/api/health/db`);
      console.log('============================================');
      console.log('');
    });

    // ---------- 3. Shut down cleanly ----------
    const shutdown = async (signal: string): Promise<void> => {
      console.log(`\n${signal} received. Shutting down...`);

      server.close(async () => {
        await closeDatabasePool();
        console.log('Database connections closed. Goodbye.');
        process.exit(0);
      });
    };

    process.on('SIGINT', () => void shutdown('SIGINT'));
    process.on('SIGTERM', () => void shutdown('SIGTERM'));
  } catch (error) {
    console.error('');
    console.error('FAILED TO START SERVER');
    console.error('----------------------');
    console.error(error);
    console.error('');
    console.error('Common causes:');
    console.error('  1. XAMPP MySQL is not running (open the XAMPP Control Panel and press Start)');
    console.error('  2. The database "leafscan_ai" does not exist (re-run Phase 3)');
    console.error('  3. backend/.env has wrong DB_USER or DB_PASSWORD values');
    console.error('');

    process.exit(1);
  }
}

void startServer();