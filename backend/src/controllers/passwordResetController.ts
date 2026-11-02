import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { RowDataPacket } from 'mysql2';
import { pool } from '../config/database'; // <-- match your authController import
import { sendResetCodeEmail } from '../services/mailService';

const CODE_TTL_MINUTES = 10;
const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_SECONDS = 60;

// A different secret than login tokens, so a reset token can never be used to log in
function resetSecret(): string {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET missing');
  return process.env.JWT_SECRET + ':password-reset';
}

const emailSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
});
const verifySchema = emailSchema.extend({
  code: z.string().trim().regex(/^\d{6}$/),
});
const resetSchema = z.object({
  resetToken: z.string().min(1),
  newPassword: z.string().min(8, 'Password must be at least 8 characters.'),
});

const GENERIC_SENT = {
  message: 'If that email is registered, a reset code has been sent.',
};

// POST /api/auth/forgot-password  { email }
export async function forgotPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = emailSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Please enter a valid email address.' });
    }
    const { email } = parsed.data;

    const [users] = await pool.query<RowDataPacket[]>(
      'SELECT id FROM users WHERE LOWER(email) = ? LIMIT 1',
      [email]
    );
    // Same answer whether or not the email exists, so attackers can't discover accounts
    if (users.length === 0) return res.json(GENERIC_SENT);
    const userId = users[0].id as number;

    // Cooldown: don't send more than one email per minute
    const [recent] = await pool.query<RowDataPacket[]>(
      `SELECT id FROM password_resets
       WHERE user_id = ? AND created_at > (NOW() - INTERVAL ? SECOND)
       LIMIT 1`,
      [userId, RESEND_COOLDOWN_SECONDS]
    );
    if (recent.length > 0) return res.json(GENERIC_SENT);

    const code = crypto.randomInt(0, 1_000_000).toString().padStart(6, '0');
    const codeHash = await bcrypt.hash(code, 10);

    // Cancel older unused codes, then save the new one
    await pool.query(
      'UPDATE password_resets SET used_at = NOW() WHERE user_id = ? AND used_at IS NULL',
      [userId]
    );
    await pool.query(
      `INSERT INTO password_resets (user_id, code_hash, expires_at)
       VALUES (?, ?, NOW() + INTERVAL ? MINUTE)`,
      [userId, codeHash, CODE_TTL_MINUTES]
    );

    await sendResetCodeEmail(email, code);
    return res.json(GENERIC_SENT);
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/verify-reset-code  { email, code }
export async function verifyResetCode(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = verifySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Enter the 6-digit code sent to your email.' });
    }
    const { email, code } = parsed.data;

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT pr.id, pr.user_id, pr.code_hash, pr.attempts
       FROM password_resets pr
       JOIN users u ON u.id = pr.user_id
       WHERE LOWER(u.email) = ? AND pr.used_at IS NULL AND pr.expires_at > NOW()
       ORDER BY pr.id DESC
       LIMIT 1`,
      [email]
    );
    if (rows.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired code. Please request a new one.' });
    }
    const reset = rows[0];

    if (reset.attempts >= MAX_ATTEMPTS) {
      await pool.query('UPDATE password_resets SET used_at = NOW() WHERE id = ?', [reset.id]);
      return res.status(429).json({ message: 'Too many wrong attempts. Please request a new code.' });
    }

    const ok = await bcrypt.compare(code, reset.code_hash);
    if (!ok) {
      await pool.query('UPDATE password_resets SET attempts = attempts + 1 WHERE id = ?', [reset.id]);
      return res.status(400).json({ message: 'Incorrect code. Please try again.' });
    }

    const resetToken = jwt.sign(
      { userId: reset.user_id, resetId: reset.id },
      resetSecret(),
      { expiresIn: '15m' }
    );
    return res.json({ resetToken });
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/reset-password  { resetToken, newPassword }
export async function resetPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = resetSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.issues[0]?.message ?? 'Invalid input.' });
    }
    const { resetToken, newPassword } = parsed.data;

    let payload: { userId: number; resetId: number };
    try {
      payload = jwt.verify(resetToken, resetSecret()) as { userId: number; resetId: number };
    } catch {
      return res.status(400).json({ message: 'Your reset session expired. Please start again.' });
    }

    // Make sure this code wasn't already used
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT id FROM password_resets WHERE id = ? AND user_id = ? AND used_at IS NULL',
      [payload.resetId, payload.userId]
    );
    if (rows.length === 0) {
      return res.status(400).json({ message: 'This reset link was already used. Please start again.' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await pool.query(
      'UPDATE users SET password_hash = ? WHERE id = ?', // <-- match your password column name
      [passwordHash, payload.userId]
    );
    await pool.query(
      'UPDATE password_resets SET used_at = NOW() WHERE user_id = ? AND used_at IS NULL',
      [payload.userId]
    );

    return res.json({ message: 'Password updated. You can now sign in.' });
  } catch (err) {
    next(err);
  }
}