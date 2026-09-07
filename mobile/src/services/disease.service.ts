/**
 * Disease Library calls.
 *
 * GET /api/diseases is public - the library is educational content
 * a farmer can browse before signing in - so requiresAuth is false.
 * `lang` selects the language of the text fields; the backend falls
 * back to English for anything not yet translated.
 */

import { api } from './api';
import { Disease } from '../types';
import { Language } from '../i18n/translations';

export async function listDiseases(lang: Language = 'en'): Promise<Disease[]> {
  const result = await api.get<{ diseases: Disease[] }>(`/diseases?lang=${lang}`, false);
  return result.diseases;
}
