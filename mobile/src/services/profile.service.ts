/**
 * Profile editing for LeafScan AI (the Settings screen).
 *
 * PATCH /api/auth/me - protected, edits the signed-in user's own
 * record. Every field is optional: send only what changed, and an
 * empty string clears a text field rather than being ignored.
 */

import { api } from './api';
import { User } from '../types';

export interface UpdateProfilePayload {
  phoneNumber?: string;
  address?: string;
  /** A relative path from a prior uploadImage() call, or '' to remove the photo. */
  avatarPath?: string;
}

export async function updateProfile(payload: UpdateProfilePayload): Promise<User> {
  const result = await api.patch<{ user: User }>('/auth/me', payload);
  return result.user;
}
