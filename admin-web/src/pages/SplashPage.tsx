/**
 * Splash screen for the CAO admin platform.
 *
 * Route: /  (and any unmatched path)
 *
 * Shown briefly whenever the site is opened, then always hands off
 * to /login - never straight to the dashboard, even if a saved
 * session would otherwise let ProtectedRoute skip it. The admin
 * must explicitly sign in every time the site is opened.
 */

import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';

import logo from '../assets/logo.png';

/** How long the splash stays up before handing off to /login. */
const SPLASH_DURATION_MS = 1200;

export function SplashPage() {
  const [done, setDone] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDone(true), SPLASH_DURATION_MS);
    return () => clearTimeout(timer);
  }, []);

  if (done) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen flex-col items-center justify-center bg-leaf-800 px-8">
      <img src={logo} alt="LeafScan AI" className="h-24 w-24 object-contain" />

      <h1 className="mt-5 text-2xl font-extrabold tracking-wide text-white">
        LeafScan AI
      </h1>

      <p className="mt-1.5 text-center text-sm text-leaf-200">
        City Agriculture Office · Pagadian City
      </p>

      <div className="mt-8 h-8 w-8 animate-spin rounded-full border-4 border-white/30 border-t-white" />
    </div>
  );
}
