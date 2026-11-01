/**
 * Login page for the CAO admin platform.
 *
 * Route: /login
 *
 * Calls POST /api/auth/login. Farmer accounts are rejected by
 * AuthContext before any token is stored.
 */

import { useState, type FormEvent } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import { ApiError } from '../services/api';
import { AuthLayout } from '../components/AuthLayout';
import { PasswordField } from '../components/PasswordField';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Set by the forgot-password page after a successful reset.
  const resetDone = (location.state as { resetDone?: boolean } | null)?.resetDone === true;

  // The site always lands here on open (see SplashPage) - even with a
  // saved session, the admin must explicitly sign in; we never
  // auto-skip to the dashboard.

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
    <AuthLayout>
      <h2 className="text-2xl font-bold text-gray-900">Sign In</h2>
      <p className="mt-1 text-sm text-gray-500">
        For City Agriculture Office personnel
      </p>

      {resetDone && !errorMessage && (
        <div className="mt-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3">
          <p className="text-sm text-green-700">
            Your password has been updated. Sign in with your new password.
          </p>
        </div>
      )}

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
        <PasswordField
          id="password"
          value={password}
          onChange={setPassword}
          placeholder="Enter your password"
          autoComplete="current-password"
          disabled={isSubmitting}
        />

        <div className="mt-2 text-right">
          <Link
            to="/forgot-password"
            className="text-sm font-medium text-leaf-700 hover:text-leaf-800 hover:underline"
          >
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-leaf-600 py-2.5 text-sm font-semibold text-white hover:bg-leaf-700 disabled:bg-leaf-400"
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
    </AuthLayout>
  );
}
