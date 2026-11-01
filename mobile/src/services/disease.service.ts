/**
 * Disease Library calls.
 *
 * GET /api/diseases is public - the library is educational content
 * a farmer can browse before signing in - so requiresAuth is false.
 * `lang` selects the language of the text fields; the backend falls
 * back to English for anything not yet translated.
 *
 * Every successful fetch is cached on the device per language, so the
 * library and the diagnosis screen keep working with no connection.
 * listDiseases() falls back to that cache when the request fails;
 * getCachedDiseases() reads it directly for an instant first paint.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

import { api } from './api';
import { Disease } from '../types';
import { Language } from '../i18n/translations';

const cacheKeyFor = (lang: Language) => `leafscan_diseases_cache_${lang}`;

/** The last library the server gave us for this language, or null if none was ever saved. */
export async function getCachedDiseases(lang: Language = 'en'): Promise<Disease[] | null> {
  try {
    const raw = await AsyncStorage.getItem(cacheKeyFor(lang));
    return raw ? (JSON.parse(raw) as Disease[]) : null;
  } catch {
    return null;
  }
}

/** Fresh from the server (and cached); throws only when offline AND nothing is cached. */
export async function listDiseases(lang: Language = 'en'): Promise<Disease[]> {
  try {
    const result = await api.get<{ diseases: Disease[] }>(`/diseases?lang=${lang}`, false);
    AsyncStorage.setItem(cacheKeyFor(lang), JSON.stringify(result.diseases)).catch(() => {});
    return result.diseases;
  } catch (error) {
    const cached = await getCachedDiseases(lang);
    if (cached) {
      console.log('[diseases] Offline - using the saved library:', error);
      return cached;
    }
    throw error;
  }
}
