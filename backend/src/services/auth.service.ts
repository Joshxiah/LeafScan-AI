/**
 * Authentication business logic for LeafScan AI.
 *
 * This layer talks to the database and applies the rules. It knows
 * nothing about HTTP - no req, no res, no status codes. That
 * separation means the same functions can be called from anywhere.
 *
 * Farmers log in with a USERNAME. Email is optional and is not
 * collected at registration.
 */

import crypto from 'crypto';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { pool } from '../config/database';
import { env } from '../config/env';
import { ApiError } from '../utils/ApiError';
import { hashPassword, verifyPassword } from '../utils/password';
import { generateToken } from '../utils/jwt';
import { sendSms } from '../utils/sms';
import { sendPasswordResetEmail } from './emailService';
import {
  RegisterInput,
  LoginInput,
  UpdateProfileInput,
  ChangePasswordInput,
  normalizePhone,
} from '../utils/validation';
import {
  UserRow,
  FarmerRow,
  PublicUser,
  PublicUserWithProfile,
  toPublicUser,
  toPublicFarmerProfile,
} from '../models/user.model';

/** What a successful register or login returns. */
export interface AuthResult {
  user: PublicUser;
  token: string;
}

/**
 * Registers a new farmer account.
 *
 * Writes to TWO tables - users and farmers - inside a transaction,
 * so a crash between them cannot leave a user without a profile.
 */
export async function registerFarmer(input: RegisterInput): Promise<AuthResult> {
  const connection = await pool.getConnection();

  try {
    // ---- Is this username already taken? ----
    const [existing] = await connection.query<UserRow[]>(
      'SELECT id FROM users WHERE username = ? LIMIT 1',
      [input.username]
    );

    if (existing.length > 0) {
      throw ApiError.conflict('That username is already taken', 'USERNAME_TAKEN');
    }

    // ---- Is this phone number already in use? ----
    // It doubles as the "Forgot password" lookup key, so two
    // accounts sharing one number would make a reset ambiguous.
    const phoneNumber = normalizePhone(input.phoneNumber);

    const [phoneRows] = await connection.query<UserRow[]>(
      'SELECT id FROM users WHERE phone_number = ? LIMIT 1',
      [phoneNumber]
    );

    if (phoneRows.length > 0) {
      throw ApiError.conflict('That mobile number is already registered', 'PHONE_TAKEN');
    }

    // ---- Hash the password. The plaintext is never stored. ----
    const passwordHash = await hashPassword(input.password);

    // ---- Both inserts succeed together, or neither happens ----
    await connection.beginTransaction();

    try {
      const [userResult] = await connection.query<ResultSetHeader>(
        `INSERT INTO users
           (full_name, username, email, phone_number, password_hash, role)
         VALUES (?, ?, NULL, ?, ?, 'farmer')`,
        [input.fullName, input.username, phoneNumber, passwordHash]
      );

      const newUserId = userResult.insertId;

      await connection.query<ResultSetHeader>(
        `INSERT INTO farmers
           (user_id, address, corn_type, farm_size_hectares, years_farming)
         VALUES (?, ?, ?, ?, ?)`,
        [
          newUserId,
          input.address || null,
          input.cornType ?? null,
          input.farmSizeHectares ?? null,
          input.yearsFarming ?? null,
        ]
      );

      await connection.commit();

      // ---- Read the finished user back ----
      const [rows] = await connection.query<UserRow[]>(
        'SELECT * FROM users WHERE id = ? LIMIT 1',
        [newUserId]
      );

      const user = toPublicUser(rows[0]);
      const token = generateToken({ userId: user.id, role: user.role });

      return { user, token };
    } catch (error) {
      // Undo everything if any step failed
      await connection.rollback();
      throw error;
    }
  } finally {
    connection.release();
  }
}

/**
 * Logs a user in. Works for BOTH farmers and CAO admins - the
 * role stored on the account decides what they can access later.
 */
export async function login(input: LoginInput): Promise<AuthResult> {
  const [rows] = await pool.query<UserRow[]>(
    'SELECT * FROM users WHERE username = ? LIMIT 1',
    [input.username]
  );

  const user = rows[0];

  // Both failures return the SAME message, so an attacker cannot
  // discover which usernames exist.
  if (!user) {
    throw ApiError.unauthorized('Invalid username or password', 'INVALID_CREDENTIALS');
  }

  const passwordMatches = await verifyPassword(input.password, user.password_hash);

  if (!passwordMatches) {
    throw ApiError.unauthorized('Invalid username or password', 'INVALID_CREDENTIALS');
  }

  if (user.is_active !== 1) {
    throw ApiError.forbidden(
      'This account has been deactivated. Please contact the City Agriculture Office.',
      'ACCOUNT_DEACTIVATED'
    );
  }

  const publicUser = toPublicUser(user);
  const token = generateToken(
    { userId: publicUser.id, role: publicUser.role },
    { rememberMe: input.rememberMe }
  );

  return { user: publicUser, token };
}

/**
 * Fetches the logged-in user, including farming details when the
 * account is a farmer. Powers GET /api/auth/me and the Profile screen.
 */
export async function getUserById(userId: number): Promise<PublicUserWithProfile> {
  const [rows] = await pool.query<UserRow[]>(
    'SELECT * FROM users WHERE id = ? LIMIT 1',
    [userId]
  );

  const user = rows[0];

  if (!user) {
    throw ApiError.notFound('User account no longer exists');
  }

  const publicUser = toPublicUser(user);

  const [farmerRows] = await pool.query<FarmerRow[]>(
    'SELECT * FROM farmers WHERE user_id = ? LIMIT 1',
    [userId]
  );

  const farmerRow = farmerRows[0];

  return {
    ...publicUser,
    farmerProfile: farmerRow ? toPublicFarmerProfile(farmerRow) : null,
  };
}

/**
 * Edits the signed-in user's own profile (Settings screen). Only
 * touches what was actually sent: a field left out of the request
 * is left alone, but a field sent as '' clears it.
 *
 * address/cornType only make sense for a farmer account - they are
 * quietly ignored for an admin rather than raising an error, since
 * the client always sends whichever fields its form shows.
 */
export async function updateProfile(
  userId: number,
  role: 'farmer' | 'admin',
  input: UpdateProfileInput
): Promise<PublicUserWithProfile> {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    if (input.fullName !== undefined) {
      await connection.query('UPDATE users SET full_name = ? WHERE id = ?', [
        input.fullName,
        userId,
      ]);
    }

    if (input.phoneNumber !== undefined) {
      const phoneNumber = normalizePhone(input.phoneNumber);

      const [existing] = await connection.query<UserRow[]>(
        'SELECT id FROM users WHERE phone_number = ? AND id != ? LIMIT 1',
        [phoneNumber, userId]
      );

      if (existing.length > 0) {
        throw ApiError.conflict('That mobile number is already registered', 'PHONE_TAKEN');
      }

      await connection.query('UPDATE users SET phone_number = ? WHERE id = ?', [
        phoneNumber,
        userId,
      ]);
    }

    // Admin-only: the address their password-reset code is sent to.
    // Farmers have no email, so it is quietly ignored for them.
    if (role === 'admin' && input.email !== undefined) {
      const [self] = await connection.query<UserRow[]>(
        'SELECT email, password_hash FROM users WHERE id = ? LIMIT 1',
        [userId]
      );

      const current = self[0];

      if (current && current.email?.toLowerCase() !== input.email) {
        // Without this, a stolen session token could point the reset
        // code at the thief's inbox and then take the account over.
        const passwordOk =
          !!input.currentPassword &&
          (await verifyPassword(input.currentPassword, current.password_hash));

        if (!passwordOk) {
          throw ApiError.badRequest(
            'Enter your current password to change your email',
            'INVALID_CURRENT_PASSWORD'
          );
        }

        const [taken] = await connection.query<UserRow[]>(
          'SELECT id FROM users WHERE email = ? AND id != ? LIMIT 1',
          [input.email, userId]
        );

        if (taken.length > 0) {
          throw ApiError.conflict('That email is already registered', 'EMAIL_TAKEN');
        }

        await connection.query('UPDATE users SET email = ? WHERE id = ?', [
          input.email,
          userId,
        ]);
      }
    }

    if (input.avatarPath !== undefined) {
      await connection.query('UPDATE users SET avatar_path = ? WHERE id = ?', [
        input.avatarPath || null,
        userId,
      ]);
    }

    if (
      role === 'farmer' &&
      (input.address !== undefined ||
        input.municipality !== undefined ||
        input.cornType !== undefined)
    ) {
      const sets: string[] = [];
      const params: (string | null)[] = [];

      if (input.address !== undefined) {
        // Kept in sync with `barangay`, matching how the CAO's own
        // Create/Edit Farmer form writes both columns together (see
        // farmer.service.ts) - so a farmer who fixes their own
        // barangay here also fixes what COALESCE(barangay, address)
        // reports on the CAO side, not just their own app.
        sets.push('address = ?', 'barangay = ?');
        params.push(input.address || null, input.address || null);
      }

      if (input.municipality !== undefined) {
        sets.push('municipality = ?');
        params.push(input.municipality || null);
      }

      if (input.cornType !== undefined) {
        sets.push('corn_type = ?');
        params.push(input.cornType);
      }

      await connection.query(
        `UPDATE farmers SET ${sets.join(', ')} WHERE user_id = ?`,
        [...params, userId]
      );
    }

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  return getUserById(userId);
}

/**
 * Changes the signed-in user's password. Works for both farmers and
 * CAO admins - the CAO hands out an account, then the holder sets a
 * password only they know. The current password must be given and
 * must verify; a deliberately specific error (INVALID_CURRENT_PASSWORD)
 * lets the client point at the right field.
 */
export async function changePassword(
  userId: number,
  input: ChangePasswordInput
): Promise<void> {
  const [rows] = await pool.query<UserRow[]>(
    'SELECT id, password_hash FROM users WHERE id = ? LIMIT 1',
    [userId]
  );

  const user = rows[0];
  if (!user) {
    throw ApiError.notFound('User account no longer exists');
  }

  const currentMatches = await verifyPassword(input.currentPassword, user.password_hash);
  if (!currentMatches) {
    throw ApiError.badRequest(
      'Your current password is incorrect',
      'INVALID_CURRENT_PASSWORD'
    );
  }

  if (input.newPassword === input.currentPassword) {
    throw ApiError.badRequest(
      'Your new password must be different from your current one',
      'PASSWORD_UNCHANGED'
    );
  }

  const passwordHash = await hashPassword(input.newPassword);
  await pool.query<ResultSetHeader>(
    'UPDATE users SET password_hash = ? WHERE id = ?',
    [passwordHash, userId]
  );
}

// ============================================================
// PASSWORD RESET  (mobile "Forgot password" flow)
//
// Two steps:
//   1. requestPasswordReset(phoneNumber) -> texts a 6-digit code
//   2. resetPassword(phoneNumber, code, newPassword) -> sets it
//
// The code is never stored; only its SHA-256 hash is. Codes last
// PASSWORD_RESET_TTL_MINUTES and lock after 5 wrong attempts.
// ============================================================

/** A row from password_reset_codes. Used only inside this file. */
interface ResetCodeRow extends RowDataPacket {
  id: number;
  user_id: number;
  code_hash: string;
  expires_at: Date;
  consumed_at: Date | null;
  attempts: number;
}

/** Max wrong guesses before a code is dead and a new one is needed. */
const MAX_RESET_ATTEMPTS = 5;

/** The message every reset request returns, whether or not the number exists. */
export const RESET_REQUEST_MESSAGE =
  'If an account with that mobile number exists, a reset code has been sent to it.';

function sha256Hex(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

/** The vague 400 that wrong-account and wrong-code failures share. */
function invalidResetCode(): ApiError {
  return ApiError.badRequest(
    'That reset code is not valid. Request a new one and try again.'
  );
}

/**
 * Creates a fresh code for this user and returns it in plain text so
 * the caller can send it. Only its hash is stored.
 */
async function issueResetCode(userId: number): Promise<string> {
  // A fresh request invalidates any earlier unused code.
  await pool.query('DELETE FROM password_reset_codes WHERE user_id = ?', [userId]);

  // Six digits, zero-padded. randomInt is cryptographically sound.
  const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
  const expiresAt = new Date(Date.now() + env.passwordResetTtlMinutes * 60_000);

  await pool.query<ResultSetHeader>(
    `INSERT INTO password_reset_codes (user_id, code_hash, expires_at)
     VALUES (?, ?, ?)`,
    [userId, sha256Hex(code), expiresAt]
  );

  return code;
}

/**
 * Checks `code` against the user's latest unused code without using it
 * up, so a screen can confirm the code before asking for a new password.
 * A wrong guess counts toward the 5-attempt lock. Throws a deliberately
 * vague 400 for every failure mode except an expired or locked code.
 */
async function checkResetCode(userId: number, code: string): Promise<void> {
  const [codeRows] = await pool.query<ResetCodeRow[]>(
    `SELECT * FROM password_reset_codes
     WHERE user_id = ? AND consumed_at IS NULL
     ORDER BY created_at DESC
     LIMIT 1`,
    [userId]
  );

  const record = codeRows[0];

  if (!record) {
    throw invalidResetCode();
  }

  if (record.attempts >= MAX_RESET_ATTEMPTS) {
    throw ApiError.badRequest(
      'Too many incorrect attempts. Please request a new reset code.'
    );
  }

  if (new Date(record.expires_at).getTime() < Date.now()) {
    throw ApiError.badRequest(
      'That reset code has expired. Please request a new one.'
    );
  }

  if (sha256Hex(code) !== record.code_hash) {
    await pool.query(
      'UPDATE password_reset_codes SET attempts = attempts + 1 WHERE id = ?',
      [record.id]
    );
    throw invalidResetCode();
  }
}

/**
 * Checks `code` (see checkResetCode). If it is right, sets the new
 * password and burns every code for the user.
 */
async function consumeResetCode(
  userId: number,
  code: string,
  newPassword: string
): Promise<void> {
  await checkResetCode(userId, code);

  // Correct. Swap the password and burn every code for this user.
  const passwordHash = await hashPassword(newPassword);
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    await connection.query('UPDATE users SET password_hash = ? WHERE id = ?', [
      passwordHash,
      userId,
    ]);

    await connection.query(
      'DELETE FROM password_reset_codes WHERE user_id = ?',
      [userId]
    );

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Step 1. Generates a code for the account with this phone number
 * and texts it. Returns nothing useful on purpose: the caller must
 * not be able to tell whether the number is registered.
 */
export async function requestPasswordReset(rawPhoneNumber: string): Promise<void> {
  const phoneNumber = normalizePhone(rawPhoneNumber);

  const [rows] = await pool.query<UserRow[]>(
    'SELECT id, full_name, is_active FROM users WHERE phone_number = ? LIMIT 1',
    [phoneNumber]
  );

  const user = rows[0];

  // No account, or a deactivated one: do nothing, silently.
  if (!user || user.is_active !== 1) {
    return;
  }

  const code = await issueResetCode(user.id);

  // Deliberately not awaited (same reason as requestAdminPasswordReset):
  // a gateway phone on Wi-Fi can take seconds to answer or time out, and
  // waiting only when the account exists would let a caller tell
  // registered numbers from unknown ones by response time.
  // sendSms never rejects - failures are logged server-side.
  void sendSms({
    to: phoneNumber,
    text:
      `${env.appName}: your password reset code is ${code}. ` +
      `It expires in ${env.passwordResetTtlMinutes} minutes. ` +
      `Did not request this? Ignore this message.`,
  });
}

/**
 * Step 2. Verifies the code and sets the new password.
 * Throws a deliberately vague 400 for every failure mode except an
 * expired or locked code, so a wrong number and a wrong code look
 * the same to the caller.
 */
export async function resetPassword(
  rawPhoneNumber: string,
  code: string,
  newPassword: string
): Promise<void> {
  const phoneNumber = normalizePhone(rawPhoneNumber);

  const [userRows] = await pool.query<UserRow[]>(
    'SELECT id FROM users WHERE phone_number = ? AND is_active = 1 LIMIT 1',
    [phoneNumber]
  );

  const user = userRows[0];

  if (!user) {
    throw invalidResetCode();
  }

  await consumeResetCode(user.id, code, newPassword);
}

// ============================================================
// CAO PASSWORD RESET BY EMAIL
//
// Same code-and-hash scheme as above, but for admin accounts only
// (farmers have no email) and the code goes to the admin's inbox.
// The address must already be on the account - the admin sets it
// from the Profile page while signed in.
// ============================================================

/** The message every CAO reset request returns, whether or not the email exists. */
export const ADMIN_RESET_REQUEST_MESSAGE =
  'If a CAO account with that email exists, a reset code has been sent to it.';

/**
 * Step 1. Emails a code to the admin account that owns this address.
 * Returns nothing useful on purpose: the caller must not be able to
 * tell whether the address is registered.
 */
export async function requestAdminPasswordReset(email: string): Promise<void> {
  const [rows] = await pool.query<UserRow[]>(
    "SELECT id, is_active FROM users WHERE email = ? AND role = 'admin' LIMIT 1",
    [email]
  );

  const user = rows[0];

  // No account, a farmer, or a deactivated one: do nothing, silently.
  if (!user || user.is_active !== 1) {
    return;
  }

  const code = await issueResetCode(user.id);

  // Deliberately not awaited. An SMTP round trip takes seconds, and
  // waiting for it only when the account exists would let a caller tell
  // registered addresses from unknown ones by response time.
  // Unlike the old sendMail, sendPasswordResetEmail rejects on failure, so it
  // must be caught here (an unhandled rejection can crash the server). The
  // error is only logged, never rethrown or sent to the client.
  sendPasswordResetEmail(email, code, env.passwordResetTtlMinutes).catch((error) => {
    console.error('[auth] Failed to send password reset email to', email, error);
  });
}

/**
 * Step 2. Confirms the emailed code is right, without using it up, so
 * the page can move on to the new-password step. The code is sent again
 * with the new password in step 3. Wrong address and wrong code fail
 * identically (see checkResetCode).
 */
export async function verifyAdminResetCode(email: string, code: string): Promise<void> {
  const [rows] = await pool.query<UserRow[]>(
    "SELECT id FROM users WHERE email = ? AND role = 'admin' AND is_active = 1 LIMIT 1",
    [email]
  );

  const user = rows[0];

  if (!user) {
    throw invalidResetCode();
  }

  await checkResetCode(user.id, code);
}

/**
 * Step 3. Verifies the emailed code and sets the new password.
 * Wrong address and wrong code fail identically (see consumeResetCode).
 */
export async function resetAdminPassword(
  email: string,
  code: string,
  newPassword: string
): Promise<void> {
  const [rows] = await pool.query<UserRow[]>(
    "SELECT id FROM users WHERE email = ? AND role = 'admin' AND is_active = 1 LIMIT 1",
    [email]
  );

  const user = rows[0];

  if (!user) {
    throw invalidResetCode();
  }

  await consumeResetCode(user.id, code, newPassword);
}
