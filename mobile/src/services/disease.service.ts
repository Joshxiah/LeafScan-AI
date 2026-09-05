/**
 * Disease Library calls.
 *
 * GET /api/diseases is public - the library is educational content
 * a farmer can browse before signing in - so requiresAuth is false.
 */

import { api } from './api';
import { Disease } from '../types';

export async function listDiseases(): Promise<Disease[]> {
  const result = await api.get<{ diseases: Disease[] }>('/diseases', false);
  return result.diseases;
}
