/**
 * Health check endpoints.
 *
 * These exist so you can confirm, in a browser, that:
 *   1. the server is running, and
 *   2. the server can reach the leafscan_ai database.
 *
 * When something breaks later, checking these first tells you
 * immediately whether the problem is your new code or your setup.
 */

import { Router, Request, Response } from 'express';
import { RowDataPacket } from 'mysql2';
import { pool } from '../config/database';

const router = Router();

/**
 * GET /api/health
 * Is the server alive?
 */
router.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'LeafScan AI backend is running',
    timestamp: new Date().toISOString(),
  });
});

/**
 * GET /api/health/db
 * Is the database reachable, and is the disease seed data present?
 *
 * Returning the disease list proves the entire chain works:
 * Express -> mysql2 -> MariaDB -> leafscan_ai -> diseases table.
 */
router.get('/db', async (req: Request, res: Response) => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id, class_label, display_name, default_risk_level
     FROM diseases
     ORDER BY class_label`
  );

  res.status(200).json({
    success: true,
    message: 'Database connection successful',
    database: 'leafscan_ai',
    diseaseCount: rows.length,
    diseases: rows,
  });
});

export default router;