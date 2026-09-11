/**
 * Login page for the CAO admin platform.
 *
 * Route: /login
 *
 * Calls POST /api/auth/login. Farmer accounts are rejected by
 * AuthContext before any token is stored.
 */

import { useState, type FormEvent } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import { ApiError } from '../services/api';
import { LeafMark } from '../components/LeafMark';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, isLoading } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Already signed in? Skip the form.
  if (!isLoading && isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  async function handleSubmit(event: FormEvent) {
    // Without this, the browser reloads the whole page on submit
    // and the React app restarts from scratch.
    event.preventDefault();

    setErrorMessage(null);

    if (!username.trim()) {
      setErrorMessage('Please enter your username.');
      return;
    }

    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsSubmitting(true);

    try {
      await login(username.trim().toLowerCase(), password);

      // Return to wherever they were headed, if anywhere.
      const from =
        (location.state as { from?: { pathname: string } } | null)?.from
          ?.pathname ?? '/dashboard';

      navigate(from, { replace: true });
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('Something went wrong. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* ---------- Left: branding ---------- */}
      <div className="hidden flex-1 flex-col justify-center bg-leaf-800 px-16 lg:flex">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white">
          <LeafMark className="h-9 w-9 text-leaf-600" />
        </div>

        <h1 className="mt-8 text-4xl font-bold text-white">LeafScan AI</h1>

        <p className="mt-3 max-w-md text-lg text-leaf-200">
          Corn Leaf Disease Detection and Treatment Recommendation System
        </p>

        <p className="mt-1 text-sm text-leaf-300">
          City Agriculture Office · Pagadian City
        </p>

        <div className="mt-12 max-w-md border-t border-leaf-700 pt-8">
          <p className="text-sm text-leaf-200">
            Monitor disease detections reported by corn farmers and publish
            expert-verified treatment recommendations.
          </p>
        </div>
      </div>

      {/* ---------- Right: form ---------- */}
      <div className="flex flex-1 items-center justify-center bg-white px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Small-screen logo, since the left panel is hidden */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-leaf-600">
              <LeafMark className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-base font-bold text-leaf-800">LeafScan AI</p>
              <p className="text-xs text-gray-500">Admin Platform</p>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900">Sign In</h2>
          <p className="mt-1 text-sm text-gray-500">
            For City Agriculture Office personnel
          </p>

          {errorMessage && (
            <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-sm text-red-700">{errorMessage}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6">
            <label
              htmlFor="username"
              className="mb-1.5 block text-sm font-medium text-gray-700"
            >
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admins"
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              disabled={isSubmitting}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-leaf-600 focus:ring-2 focus:ring-leaf-100 disabled:bg-gray-50"
            />

            <label
              htmlFor="password"
              className="mb-1.5 mt-5 block text-sm font-medium text-gray-700"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                disabled={isSubmitting}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 pr-16 text-sm outline-none focus:border-leaf-600 focus:ring-2 focus:ring-leaf-100 disabled:bg-gray-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-leaf-700 hover:text-leaf-800"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-7 flex w-full items-center justify-center gap-2 rounded-lg bg-leaf-600 py-2.5 text-sm font-semibold text-white hover:bg-leaf-700 disabled:bg-leaf-400"
            >
              {isSubmitting && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              )}
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-gray-400">
            Farmers should use the LeafScan AI mobile application.
          </p>
        </div>
      </div>
    </div>
  );
}
