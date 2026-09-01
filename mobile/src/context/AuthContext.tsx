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
  ReactNode,
} from 'react';

import * as authService from '../services/auth.service';
import { saveToken, getToken, deleteToken } from '../services/storage';
import { User, LoginPayload, RegisterPayload } from '../types';

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
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Runs once when the app starts.
   *
   * If a token was saved from a previous session, we ask the
   * backend whether it is still valid. We do not simply trust it,
   * because it may have expired or the account may be deactivated.
   */
  useEffect(() => {
    let isMounted = true;

    async function restoreSession() {
      try {
        const token = await getToken();

        if (!token) {
          return;
        }

        const currentUser = await authService.getCurrentUser();

        if (isMounted) {
          setUser(currentUser);
        }
      } catch (error) {
        // Token invalid, expired, or the server is unreachable.
        // Clear it so the user starts clean.
        console.log('[auth] Could not restore session:', error);
        await deleteToken();
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void restoreSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    const result = await authService.login(payload);

    await saveToken(result.token);
    setUser(result.user);
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    const result = await authService.register(payload);

    await saveToken(result.token);
    setUser(result.user);
  }, []);

  const logout = useCallback(async () => {
    await deleteToken();
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('[auth] Failed to refresh user:', error);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
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