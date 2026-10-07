/**
 * Secure storage for the login token.
 *
 * On a phone, expo-secure-store writes to the iOS Keychain / Android
 * Keystore, which is encrypted and isolated from other applications.
 * The token is a credential, so it does not belong in plain storage.
 *
 * On the web there is no Keychain, and expo-secure-store has no
 * browser implementation, so we fall back to localStorage. That is
 * less private than the Keychain but is the standard place a web app
 * keeps a session token.
 *
 * Every function here fails quietly rather than crashing. A storage
 * problem should log the user out, not break the app.
 */

import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { config } from '../constants/config';

const KEY = config.tokenStorageKey;

/** Where a "Remember me" login keeps the farmer's profile, for offline start-up. */
const USER_KEY = 'leafscan_cached_user';

/**
 * A token from a login with "Remember me" UNCHECKED. It lives only
 * in memory, so it is gone as soon as the app is closed - the
 * shared-phone case. A remembered token is written to SecureStore.
 */
let sessionToken: string | null = null;

const isWeb = Platform.OS === 'web';

/**
 * The browser's localStorage, or undefined when it is not reachable
 * (server-side rendering during `expo export`, private-mode quirks).
 */
function webStore(): Storage | undefined {
  try {
    return globalThis.localStorage;
  } catch {
    return undefined;
  }
}

/**
 * Saves the login token.
 *
 * remember = true  ("Remember me" checked): kept on the device and
 *                  restored the next time the app opens.
 * remember = false: kept in memory only, until the app is closed.
 */
export async function saveToken(token: string, remember = true): Promise<void> {
  if (!remember) {
    sessionToken = token;
    await deleteToken({ keepSession: true });
    return;
  }

  sessionToken = null;
  try {
    if (isWeb) {
      webStore()?.setItem(KEY, token);
      return;
    }
    await SecureStore.setItemAsync(KEY, token);
  } catch (error) {
    console.error('[storage] Failed to save token:', error);
  }
}

/**
 * Reads the current token, or null if there is none: the in-memory
 * session token first, then the remembered one on the device.
 *
 * Called when the app starts, so a farmer who logged in with
 * "Remember me" does not have to log in again.
 */
export async function getToken(): Promise<string | null> {
  if (sessionToken) {
    return sessionToken;
  }
  try {
    if (isWeb) {
      return webStore()?.getItem(KEY) ?? null;
    }
    return await SecureStore.getItemAsync(KEY);
  } catch (error) {
    console.error('[storage] Failed to read token:', error);
    return null;
  }
}

/**
 * Deletes the token (memory and device). This IS logout on the
 * device side.
 *
 * Note an honest limitation: a JWT cannot be revoked by the
 * server, because the server keeps no session record. Deleting
 * it here means this device can no longer use it, and the token
 * expires on its own (1 day, or 90 days with "Remember me").
 */
export async function deleteToken(
  { keepSession = false }: { keepSession?: boolean } = {}
): Promise<void> {
  if (!keepSession) {
    sessionToken = null;
  }
  try {
    if (isWeb) {
      webStore()?.removeItem(KEY);
      return;
    }
    await SecureStore.deleteItemAsync(KEY);
  } catch (error) {
    console.error('[storage] Failed to delete token:', error);
  }
}

/**
 * Saves the signed-in user's profile on the device ("Remember me"
 * logins only), so the app can open straight to Home with no
 * internet. Refreshed from the server whenever it is reachable.
 */
export async function saveCachedUser(user: unknown): Promise<void> {
  try {
    const value = JSON.stringify(user);
    if (isWeb) {
      webStore()?.setItem(USER_KEY, value);
      return;
    }
    await SecureStore.setItemAsync(USER_KEY, value);
  } catch (error) {
    console.error('[storage] Failed to save cached user:', error);
  }
}

/** Reads the cached profile, or null if there is none or it is unreadable. */
export async function getCachedUser<T>(): Promise<T | null> {
  try {
    const value = isWeb
      ? webStore()?.getItem(USER_KEY) ?? null
      : await SecureStore.getItemAsync(USER_KEY);
    return value ? (JSON.parse(value) as T) : null;
  } catch (error) {
    console.error('[storage] Failed to read cached user:', error);
    return null;
  }
}

/** Removes the cached profile. Part of logging out. */
export async function deleteCachedUser(): Promise<void> {
  try {
    if (isWeb) {
      webStore()?.removeItem(USER_KEY);
      return;
    }
    await SecureStore.deleteItemAsync(USER_KEY);
  } catch (error) {
    console.error('[storage] Failed to delete cached user:', error);
  }
}

const LANGUAGE_KEY = config.languageStorageKey;

/**
 * Saves the farmer's chosen app language, so it is remembered the
 * next time the app opens. Not a secret, but SecureStore already
 * has the web/native split solved, so it is reused here rather
 * than adding a second storage dependency for one small value.
 */
export async function saveLanguage(language: string): Promise<void> {
  try {
    if (isWeb) {
      webStore()?.setItem(LANGUAGE_KEY, language);
      return;
    }
    await SecureStore.setItemAsync(LANGUAGE_KEY, language);
  } catch (error) {
    console.error('[storage] Failed to save language:', error);
  }
}

/** Reads the saved language, or null if none was ever chosen. */
export async function getLanguage(): Promise<string | null> {
  try {
    if (isWeb) {
      return webStore()?.getItem(LANGUAGE_KEY) ?? null;
    }
    return await SecureStore.getItemAsync(LANGUAGE_KEY);
  } catch (error) {
    console.error('[storage] Failed to read language:', error);
    return null;
  }
}
