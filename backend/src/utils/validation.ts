/**
 * Input validation for LeafScan AI.
 *
 * Farmers log in with a USERNAME and password. Email is not
 * collected, so a phone number is required instead - it is the
 * only way the CAO can contact a farmer.
 */

import { z } from 'zod';
import { ApiError } from './ApiError';

/**
 * Usernames are lowercase letters, numbers, underscore and dot.
 * Restricting the character set avoids confusing lookalikes and
 * makes the value safe to display anywhere.
 */
const usernameRule = z
  .string()
  .trim()
  .toLowerCase()
  .min(4, 'Username must be at least 4 characters')
  .max(50, 'Username must be at most 50 characters')
  .regex(
    /^[a-z0-9._]+$/,
    'Username can only contain letters, numbers, dots and underscores'
  );

/**
 * Philippine mobile numbers: 11 digits starting 09,
 * or the +63 form.
 */
const phoneRule = z
  .string()
  .trim()
  .regex(
    /^(09\d{9}|\+639\d{9})$/,
    'Enter a valid mobile number, for example 09171234567'
  );

/**
 * Collapses the two accepted phone forms into one, so "09171234567"
 * and "+639171234567" are recognised as the same number everywhere
 * that looks a user up by phone (registration uniqueness, the
 * "Forgot password" flow).
 */
export function normalizePhone(phoneNumber: string): string {
  const trimmed = phoneNumber.trim();
  return trimmed.startsWith('+63') ? `0${trimmed.slice(3)}` : trimmed;
}

/** A 6-digit password-reset code, exactly as typed into the app. */
const resetCodeRule = z
  .string()
  .trim()
  .regex(/^\d{6}$/, 'Enter the 6-digit code from the text message');

export const registerSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Full name must be at least 2 characters')
    .max(150, 'Full name must be at most 150 characters'),

  username: usernameRule,

  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password must be at most 72 characters'),

  phoneNumber: phoneRule,

  address: z.string().trim().max(255).optional().or(z.literal('')),

  cornType: z.enum(['white', 'yellow', 'both']).optional(),
  farmSizeHectares: z.number().positive().max(9999).optional(),
  yearsFarming: z.number().int().nonnegative().max(120).optional(),
});

export const loginSchema = z.object({
  username: z.string().trim().toLowerCase().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

/**
 * Editing an existing profile (Settings screen). Every field is
 * optional - a request only sends what actually changed - and an
 * empty string clears a text field rather than being ignored.
 * cornType/address only apply to farmer accounts; the service
 * quietly ignores them for an admin.
 */
export const updateProfileSchema = z.object({
  phoneNumber: phoneRule.optional(),
  address: z.string().trim().max(255).optional().or(z.literal('')),
  cornType: z.enum(['white', 'yellow', 'both']).optional(),
  /** Relative path from a prior POST /api/uploads, or '' to remove the photo. */
  avatarPath: z.string().trim().max(255).optional().or(z.literal('')),
});

/** Step 1 of a reset: "text a code to this phone number". */
export const forgotPasswordSchema = z.object({
  phoneNumber: phoneRule,
});

/** Step 2 of a reset: "here is the code and my new password". */
export const resetPasswordSchema = z.object({
  phoneNumber: phoneRule,
  code: resetCodeRule,
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password must be at most 72 characters'),
});

/**
 * A farmer's outbreak report. The counts and breakdown are a
 * snapshot the phone computed from the farmer's own scan history -
 * this endpoint trusts and stores them rather than recomputing them
 * server-side, since there is no server-side scan history yet
 * (Phase 13 - see backend/src/services/scanLog equivalent on mobile).
 */
export const createReportSchema = z.object({
  barangay: z.string().trim().max(150).optional().or(z.literal('')),
  municipality: z.string().trim().max(100).optional().or(z.literal('')),

  totalScans: z.number().int().nonnegative().max(100000),
  affectedScans: z.number().int().nonnegative().max(100000),
  healthyScans: z.number().int().nonnegative().max(100000),

  diseaseBreakdown: z
    .array(
      z.object({
        classLabel: z.string().trim().min(1).max(50),
        displayName: z.string().trim().min(1).max(150),
        count: z.number().int().nonnegative().max(100000),
      })
    )
    .max(20)
    .optional(),

  estimatedAreaHectares: z.number().nonnegative().max(99999).optional(),
  remarks: z.string().trim().max(2000).optional().or(z.literal('')),
});

/** An admin moving a report through its lifecycle. */
export const reportStatusSchema = z.object({
  status: z.enum(['reviewed', 'resolved']),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type CreateReportInput = z.infer<typeof createReportSchema>;
export type ReportStatusInput = z.infer<typeof reportStatusSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export function validate<T>(schema: z.ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data);

  if (!result.success) {
    const firstIssue = result.error.issues[0];
    const field = firstIssue.path.join('.');
    const message = field ? `${field}: ${firstIssue.message}` : firstIssue.message;

    throw ApiError.badRequest(message);
  }

  return result.data;
}