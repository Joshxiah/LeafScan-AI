/**
 * Input validation for LeafScan AI.
 *
 * Every piece of data arriving from a phone or browser is
 * untrusted. These schemas define exactly what is acceptable, so
 * bad input is rejected before it reaches any business logic.
 */

import { z } from 'zod';
import { ApiError } from './ApiError';

/**
 * Registration data sent by the Create Account screen.
 */
export const registerSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Full name must be at least 2 characters')
    .max(150, 'Full name must be at most 150 characters'),

  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Please enter a valid email address')
    .max(150, 'Email must be at most 150 characters'),

  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password must be at most 72 characters'),

  phoneNumber: z
    .string()
    .trim()
    .max(20, 'Phone number must be at most 20 characters')
    .optional()
    .or(z.literal('')),

  // Farming details. All optional so a farmer can register quickly
  // and complete their profile later.
  barangay: z.string().trim().max(100).optional().or(z.literal('')),
  cornType: z.enum(['white', 'yellow', 'both']).optional(),
  farmSizeHectares: z.number().positive().max(9999).optional(),
  yearsFarming: z.number().int().nonnegative().max(120).optional(),
});

/**
 * Login data sent by the Login screen.
 */
export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Please enter a valid email address'),

  password: z.string().min(1, 'Password is required'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

/**
 * Runs data through a schema and converts any failure into an
 * ApiError carrying a message a user can actually understand.
 */
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