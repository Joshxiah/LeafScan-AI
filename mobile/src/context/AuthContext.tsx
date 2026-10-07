/**
 * Global authentication state for LeafScan AI.
 *
 * Holds the logged-in user and exposes login, register, and
 * logout to every screen. Any screen can read it with:
 *
 *   const { user, logout } = useAuth();
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  ReactNode,
} from 'react';

import * as authService from '../services/auth.service';
import { ApiError } from '../services/api';
import {
  saveToken,
  getToken,
  deleteToken,
  saveCachedUser,
  getCachedUser,
  deleteCachedUser,
} from '../services/storage';
import { User, LoginPayload, RegisterPayload } from '../types';

/**
 * HOW SIGN-IN WORKS (offline-first)
 *
 * - The FIRST login always needs the server: accounts are issued by
 *   the CAO, so the phone cannot check a password it has never seen.
 * - "Remember me" CHECKED: the server issues a long-lived token
 *   (90 days by default). The token and the farmer's profile are
 *   kept on the phone, so the app opens straight to Home - with or
 *   without internet - until the farmer logs out.
 * - "Remember me" UNCHECKED: a short token kept in memory only. The
 *   farmer is signed out when the app is closed (shared phones).
 * - The app signs a farmer out ONLY when the server actually rejects
 *   the token (expired, deactivated account). Having no connection
 *   is never a reason to sign out.
 */

/**
 * True when the server answered and refused the session - as opposed
 * to the server simply being unreachable (status 0 / 408).
 */
function isSessionRejected(error: unknown): boolean {
  return error instanceof ApiError && (error.status === 401 || error.status === 403);
}

interface AuthContextValue {
  /** The logged-in user, or null when logged out. */
  user: User | null;

  /** True while the app checks for a saved token at startup. */
  isLoading: boolean;

  /** Convenience flag used by the routing guard. */
  isAuthenticated: boolean;

  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;

  /** Re-fetches the user, e.g. after editing the profile. */
  refreshUser: () => Promise<void>;

  /**
   * The current session token, kept in memory alongside the copy in
   * SecureStore/localStorage so a screen can build an authenticated
   * media URL (e.g. a profile photo from /uploads, which now
   * requires a token - see backend/src/middleware/auth.middleware.ts)
   * without a separate async storage read of its own.
   */
  token: string | null;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /** Whether this session was a "Remember me" login (profile cached on the phone). */
  const rememberedRef = useRef(false);

  const clearSession = useCallback(async () => {
    rememberedRef.current = false;
    await deleteToken();
    await deleteCachedUser();
    setToken(null);
    setUser(null);
  }, []);

  /**
   * Runs once when the app starts.
   *
   * A remembered session opens immediately from the phone's cached
   * profile, so it works offline. The server is then asked in the
   * background whether the token is still valid: if it says no, the
   * farmer is signed out; if it cannot be reached, nothing changes.
   */
  useEffect(() => {
    let isMounted = true;

    async function restoreSession() {
      const savedToken = await getToken();

      if (!savedToken) {
        if (isMounted) setIsLoading(false);
        return;
      }

      rememberedRef.current = true;
      const cachedUser = await getCachedUser<User>();

      if (isMounted) {
        setToken(savedToken);
        if (cachedUser) {
          setUser(cachedUser);
          // Show Home right away; the check below runs in the background.
          setIsLoading(false);
        }
      }

      try {
        const currentUser = await authService.getCurrentUser();
        await saveCachedUser(currentUser);
        if (isMounted) setUser(currentUser);
      } catch (error) {
        if (isSessionRejected(error)) {
          console.log('[auth] Saved session was rejected by the server:', error);
          await clearSession();
        } else {
          // Offline / server down: keep the remembered session.
          console.log('[auth] Server unreachable - staying signed in offline:', error);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    void restoreSession();

    return () => {
      isMounted = false;
    };
  }, [clearSession]);

  const login = useCallback(async (payload: LoginPayload) => {
    const username = (payload.username ?? payload.email ?? '').trim();
    const rememberMe = payload.rememberMe ?? false;

    const result = await authService.login({
      username: username.toLowerCase(),
      password: payload.password,
      rememberMe,
    });

    rememberedRef.current = rememberMe;
    await saveToken(result.token, rememberMe);
    if (rememberMe) {
      await saveCachedUser(result.user);
    } else {
      await deleteCachedUser();
    }

    setToken(result.token);
    setUser(result.user);
  }, []);

  /**
   * Self-registration is disabled on the backend (accounts come from
   * the CAO), so this only ever surfaces the server's message. Kept
   * so the existing screens still type-check.
   */
  const register = useCallback(async (payload: RegisterPayload) => {
    const username = (payload.username ?? payload.fullName ?? '').trim();

    const result = await authService.register({
      fullName: payload.fullName,
      username: username.toLowerCase(),
      password: payload.password,
      phoneNumber: payload.phoneNumber,
      address: payload.address,
    });

    rememberedRef.current = false;
    await saveToken(result.token, false);
    setToken(result.token);
    setUser(result.user);
  }, []);

  const logout = useCallback(async () => {
    await clearSession();
  }, [clearSession]);

  const refreshUser = useCallback(async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      if (rememberedRef.current) {
        await saveCachedUser(currentUser);
      }
      setUser(currentUser);
    } catch (error) {
      if (isSessionRejected(error)) {
        await clearSession();
        return;
      }
      console.error('[auth] Failed to refresh user:', error);
    }
  }, [clearSession]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: user !== null,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook for reading the auth state.
 *
 * Throws a clear error if used outside AuthProvider, which is a
 * much better failure than a silent undefined.
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used inside an AuthProvider');
  }

  return context;
}