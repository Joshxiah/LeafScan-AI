/**
 * URL helpers for files served from the backend's /uploads route.
 *
 * That route now requires a valid login token (see
 * backend/src/middleware/auth.middleware.ts#authenticateAsset) so a
 * farmer's photo - profile picture or corn leaf scan - is not
 * readable by anyone who merely obtains the URL. An <Image>/<img>
 * tag cannot attach an Authorization header, so the token travels
 * as a query parameter instead.
 */

import { config } from '../constants/config';

/** Appends the current session token to a URL, if there is one. */
export function withAuthToken(url: string, token: string | null): string {
  if (!token) {
    return url;
  }

  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}token=${encodeURIComponent(token)}`;
}

/** Builds a displayable, authenticated URL for a stored relative path such as "uploads/xxx.jpg". */
export function mediaUrl(relativePath: string | null | undefined, token: string | null): string | null {
  if (!relativePath) {
    return null;
  }

  return withAuthToken(`${config.backendOrigin}/${relativePath}`, token);
}
