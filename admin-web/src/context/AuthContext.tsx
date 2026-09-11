/**
 * Global authentication state for the CAO admin platform.
 *
 * Enforces one rule the mobile app does not need: only accounts
 * with role 'admin' may sign in here.
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';

import * as authService from '../services/auth.service';
import { saveToken, getToken, deleteToken, ApiError } from '../services/api';
import type { User } from '../types';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  /** Re-fetch the signed-in user, e.g. after editing the profile. */
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Runs once on page load. Restores the session if a valid
   * admin token is saved, so a refresh does not log you out.
   */
  useEffect(() => {
    let isMounted = true;

    async function restoreSession() {
      try {
        if (!getToken()) {
          return;
        }

        const currentUser = await authService.getCurrentUser();

        // Guard again on restore. A farmer token saved in this
        // browser must not grant admin access.
        if (currentUser.role !== 'admin') {
          deleteToken();
          return;
        }

        if (isMounted) {
          setUser(currentUser);
        }
      } catch (error) {
        console.log('[auth] Could not restore session:', error);
        deleteToken();
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

  const login = useCallback(async (username: string, password: string) => {
    const result = await authService.login(username, password);

    // Reject farmers BEFORE storing anything.
    if (result.user.role !== 'admin') {
      throw new ApiError(
        403,
        'This platform is for City Agriculture Office personnel only. Farmers should use the LeafScan AI mobile app.'
      );
    }

    saveToken(result.token);
    setUser(result.user);
  }, []);

  const logout = useCallback(() => {
    deleteToken();
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      if (currentUser.role === 'admin') {
        setUser(currentUser);
      }
    } catch (error) {
      console.log('[auth] Could not refresh user:', error);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: user !== null,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used inside an AuthProvider');
  }

  return context;
}
