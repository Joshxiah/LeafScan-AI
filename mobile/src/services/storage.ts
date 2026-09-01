/**
 * Secure storage for the login token.
 *
 * expo-secure-store writes to the Android Keystore, which is
 * encrypted and isolated from other applications. The token is
 * a credential, so it does not belong in plain storage.
 *
 * Every function here fails quietly rather than crashing. A
 * storage problem should log the user out, not break the app.
 */

import * as SecureStore from 'expo-secure-store';
import { config } from '../constants/config';

/**
 * Saves the login token on the device.
 */
export async function saveToken(token: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(config.tokenStorageKey, token);
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
    return await SecureStore.getItemAsync(config.tokenStorageKey);
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
    await SecureStore.deleteItemAsync(config.tokenStorageKey);
  } catch (error) {
    console.error('[storage] Failed to delete token:', error);
  }
}