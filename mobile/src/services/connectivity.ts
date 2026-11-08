/**
 * Quick "is there any internet right now?" check.
 *
 * Without it, a phone on Wi-Fi that has no internet behind it makes the upload
 * hang for a full minute before the app gives up - the farmer would stare at a
 * spinner instead of getting their result. Android knows within a moment
 * (isInternetReachable is false when the network has no internet), so ask first.
 *
 * Only a clear "no" counts. If the answer is unknown or the check fails, this says
 * false and the normal online path runs; it falls back to scanning on the phone by
 * itself if the connection then turns out not to work.
 */

import { Platform } from 'react-native';

export async function isDefinitelyOffline(): Promise<boolean> {
  if (Platform.OS === 'web') return false; // a browser's own "online" flag is not worth trusting here

  try {
    // Required here so a build without the native module cannot crash the app.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Network = require('expo-network') as typeof import('expo-network');
    const state = await Network.getNetworkStateAsync();
    return state.isConnected === false || state.isInternetReachable === false;
  } catch {
    return false;
  }
}
