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
  /** CAO staff edit this from the admin Profile page; farmers do not. */
  fullName: z
    .string()
    .trim()
    .min(2, 'Full name must be at least 2 characters')
    .max(150, 'Full name must be at most 150 characters')
    .optional(),
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
 * A signed-in user changing their own password. The CAO issues the
 * account; the account holder then sets a password only they know.
 * Used by the admin Profile page and the mobile Settings screen
 * through the same POST /api/auth/change-password.
 */
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Enter your current password'),
  newPassword: z
    .string()
    .min(8, 'New password must be at least 8 characters')
    .max(72, 'New password must be at most 72 characters'),
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

  /**
   * The farmer's OWN scan photos for this report, one per image
   * they chose to include. class_label/display_name mirror what the
   * phone classified that photo as, so the CAO can group photos by
   * disease and verify them. image_path is a relative "uploads/xxx.jpg"
   * from a prior POST /api/uploads.
   */
  images: z
    .array(
      z.object({
        imagePath: z.string().trim().min(1).max(255),
        classLabel: z.string().trim().max(50).optional().or(z.literal('')),
        displayName: z.string().trim().max(150).optional().or(z.literal('')),
        confidenceScore: z.number().min(0).max(100).optional(),
        riskLevel: z.enum(['none', 'low', 'moderate', 'high']).optional(),
      })
    )
    .max(30)
    .optional(),

  estimatedAreaHectares: z.number().nonnegative().max(99999).optional(),
  remarks: z.string().trim().max(2000).optional().or(z.literal('')),
});

/**
 * An admin moving a report through the field-assessment lifecycle:
 *   pending -> under_review -> verified -> agriculturist_required
 *   -> agriculturist_assigned -> field_assessment_completed -> resolved
 * Any forward (or corrective) jump is allowed; the UI presents the
 * sensible next steps. An optional short message is relayed to the
 * farmer with the status-change notification.
 */
export const reportStatusSchema = z.object({
  status: z.enum([
    'under_review',
    'verified',
    'agriculturist_required',
    'agriculturist_assigned',
    'field_assessment_completed',
    'resolved',
  ]),
  message: z.string().trim().max(500).optional().or(z.literal('')),
  /**
   * The agriculturist being sent to the area, chosen from the CAO's
   * directory. Relevant for the agriculturist_* statuses. Send a
   * numeric id to assign, `null` to clear it, or omit to leave
   * whatever is already recorded untouched.
   */
  agriculturistId: z.number().int().positive().nullable().optional(),
  /**
   * Legacy free-text agriculturist name. Superseded by
   * `agriculturistId`; kept so older mobile builds keep working.
   */
  agriculturist: z.string().trim().max(150).optional(),
});

/**
 * One farm plot ("luna"). A farmer can work several across different
 * puroks, each quoted in hectares or square metres. The service
 * normalises area_value to hectares for summing.
 */
export const farmPlotSchema = z.object({
  purok: z.string().trim().max(100).optional().or(z.literal('')),
  areaValue: z.number().positive('Plot area must be greater than zero').max(10_000_000),
  areaUnit: z.enum(['hectare', 'sqm']),
  note: z.string().trim().max(255).optional().or(z.literal('')),
});

/**
 * The CAO creating a farmer account from the admin platform. Farmers
 * no longer self-register (see auth.routes.ts) - the City Agriculture
 * Office issues credentials. Username and password are optional: when
 * omitted the service generates them and returns them once so the CAO
 * can hand them to the farmer.
 */
export const createFarmerSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Full name must be at least 2 characters')
    .max(150, 'Full name must be at most 150 characters'),

  username: usernameRule.optional(),

  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password must be at most 72 characters')
    .optional(),

  phoneNumber: phoneRule,

  barangay: z.string().trim().max(255).optional().or(z.literal('')),
  /** Legacy single-number farm size. Superseded by `plots`; still accepted. */
  farmSizeHectares: z.number().positive().max(9999).optional(),
  /** The farmer's plots by purok. When present, drives farm_size_hectares. */
  plots: z.array(farmPlotSchema).max(20).optional(),
  yearsFarming: z.number().int().nonnegative().max(120).optional(),
});

/** The CAO editing a farmer account (activate / deactivate / fix details). */
export const updateFarmerSchema = z.object({
  fullName: z.string().trim().min(2).max(150).optional(),
  phoneNumber: phoneRule.optional(),
  barangay: z.string().trim().max(255).optional().or(z.literal('')),
  farmSizeHectares: z.number().positive().max(9999).optional(),
  /** Replaces the farmer's whole set of plots when present. */
  plots: z.array(farmPlotSchema).max(20).optional(),
  yearsFarming: z.number().int().nonnegative().max(120).optional(),
  isActive: z.boolean().optional(),
  /** Set a new password for the farmer; returned once to the CAO. */
  password: z.string().min(8).max(72).optional(),
});

/**
 * The CAO adding an agriculturist to its directory. Not a login
 * account - just a reference record. Only the name is required; the
 * phone rule is deliberately loose here (an office landline is fine),
 * unlike a farmer's mobile number.
 */
export const createAgriculturistSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Full name must be at least 2 characters')
    .max(150, 'Full name must be at most 150 characters'),
  phoneNumber: z.string().trim().max(20).optional().or(z.literal('')),
  email: z
    .string()
    .trim()
    .max(150)
    .email('Enter a valid email address')
    .optional()
    .or(z.literal('')),
  barangay: z.string().trim().max(150).optional().or(z.literal('')),
  municipality: z.string().trim().max(100).optional().or(z.literal('')),
  specialization: z.string().trim().max(150).optional().or(z.literal('')),
});

/** The CAO editing an agriculturist (fix details / activate / deactivate). */
export const updateAgriculturistSchema = z.object({
  fullName: z.string().trim().min(2).max(150).optional(),
  phoneNumber: z.string().trim().max(20).optional().or(z.literal('')),
  email: z
    .string()
    .trim()
    .max(150)
    .email('Enter a valid email address')
    .optional()
    .or(z.literal('')),
  barangay: z.string().trim().max(150).optional().or(z.literal('')),
  municipality: z.string().trim().max(100).optional().or(z.literal('')),
  specialization: z.string().trim().max(150).optional().or(z.literal('')),
  isActive: z.boolean().optional(),
});

/**
 * The CAO editing a disease's reference content from the admin
 * Diseases page. The four classes are fixed (they mirror the model's
 * output), so there is no create/delete - only edits to the text and
 * the default risk level, which the schema deliberately stores as
 * data so the CAO can change it without code.
 */
export const updateDiseaseSchema = z.object({
  displayName: z.string().trim().min(2).max(100).optional(),
  scientificName: z.string().trim().max(150).optional().or(z.literal('')),
  description: z.string().trim().max(4000).optional().or(z.literal('')),
  symptoms: z.string().trim().max(4000).optional().or(z.literal('')),
  defaultRiskLevel: z.enum(['none', 'low', 'moderate', 'high']).optional(),
});

/** The CAO adding a treatment recommendation for a disease. */
export const createRecommendationSchema = z.object({
  diseaseId: z.number().int().positive(),
  title: z.string().trim().min(2, 'Title must be at least 2 characters').max(150),
  recommendationText: z
    .string()
    .trim()
    .min(2, 'Recommendation text is required')
    .max(4000),
  applicationMethod: z.string().trim().max(4000).optional().or(z.literal('')),
  preventiveMeasures: z.string().trim().max(4000).optional().or(z.literal('')),
  isActive: z.boolean().optional(),
});

/** The CAO editing an existing recommendation. */
export const updateRecommendationSchema = z.object({
  title: z.string().trim().min(2).max(150).optional(),
  recommendationText: z.string().trim().min(2).max(4000).optional(),
  applicationMethod: z.string().trim().max(4000).optional().or(z.literal('')),
  preventiveMeasures: z.string().trim().max(4000).optional().or(z.literal('')),
  isActive: z.boolean().optional(),
});

/**
 * A completed leaf scan the mobile app is recording. Until the
 * server-side model exists (Phase 13) the phone runs a stand-in
 * classifier and posts its verdict here, so every scan a farmer
 * runs lands in the same `detections` table the CAO's Detections
 * page and dashboard read. `predictedClass` is a diseases.class_label.
 */
export const createDetectionSchema = z.object({
  imagePath: z.string().trim().min(1).max(255),
  predictedClass: z.string().trim().min(1).max(50),
  confidenceScore: z.number().min(0).max(100),
});

/**
 * A CAO agronomist reviewing a leaf scan. This never edits the
 * model's output - it records a parallel verdict: leave it
 * 'unreviewed', mark it 'confirmed', or mark it 'corrected' and name
 * the class it really is.
 */
export const reviewDetectionSchema = z.object({
  status: z.enum(['unreviewed', 'confirmed', 'corrected']),
  /** class_label of the true disease; required in spirit when status is 'corrected'. */
  correctedClass: z.string().trim().max(50).optional().or(z.literal('')),
  note: z.string().trim().max(2000).optional().or(z.literal('')),
});

export type FarmPlotInput = z.infer<typeof farmPlotSchema>;
export type CreateFarmerInput = z.infer<typeof createFarmerSchema>;
export type UpdateFarmerInput = z.infer<typeof updateFarmerSchema>;
export type CreateAgriculturistInput = z.infer<typeof createAgriculturistSchema>;
export type UpdateAgriculturistInput = z.infer<typeof updateAgriculturistSchema>;
export type UpdateDiseaseInput = z.infer<typeof updateDiseaseSchema>;
export type CreateRecommendationInput = z.infer<typeof createRecommendationSchema>;
export type UpdateRecommendationInput = z.infer<typeof updateRecommendationSchema>;
export type CreateDetectionInput = z.infer<typeof createDetectionSchema>;
export type ReviewDetectionInput = z.infer<typeof reviewDetectionSchema>;

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
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