/**
 * Route guard for the admin platform.
 *
 * Wraps any page that requires a logged-in CAO administrator.
 * The web equivalent of app/(app)/_layout.tsx in the mobile app.
 */

import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';

import { useAuth } from '../context/AuthContext';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Still checking the saved token. Showing a spinner avoids a
  // brief flash of the login page on every refresh.
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-leaf-200 border-t-leaf-600" />
          <p className="mt-4 text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // "state" remembers where they were heading, so after login
    // they land there instead of always on the dashboard.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
