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
 * Saves the login token on the device.
 */
export async function saveToken(token: string): Promise<void> {
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
 * Reads the saved token, or null if there is none.
 *
 * Called when the app starts, so a farmer who logged in
 * yesterday does not have to log in again today.
 */
export async function getToken(): Promise<string | null> {
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
 * Deletes the saved token. This IS logout on the device side.
 *
 * Note an honest limitation: a JWT cannot be revoked by the
 * server, because the server keeps no session record. Deleting
 * it here means this device can no longer use it, and the token
 * expires on its own after 7 days.
 */
export async function deleteToken(): Promise<void> {
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
