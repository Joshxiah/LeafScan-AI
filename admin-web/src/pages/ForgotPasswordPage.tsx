/**
 * Forgot-password page for the CAO admin platform.
 *
 * Route: /forgot-password
 *
 * Three steps on one page:
 *   1. enter the account's email -> POST /api/auth/forgot-password
 *      emails a 6-digit code
 *   2. enter the code -> POST /api/auth/verify-reset-code
 *      returns a short-lived resetToken, kept in component state only
 *   3. enter a new password -> POST /api/auth/reset-password
 *
 * Step 2 is always shown after step 1, whether or not the address is
 * registered, so the page does not reveal which emails have accounts.
 */

import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { ApiError } from '../services/api';
import * as authService from '../services/auth.service';
import { AuthLayout } from '../components/AuthLayout';
import { PasswordField } from '../components/PasswordField';

const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;

/** The backend sends at most one code a minute per account. */
const RESEND_COOLDOWN_SECONDS = 60;

type Step = 'email' | 'code' | 'password';

const inputClass =
  'w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-leaf-600 focus:ring-2 focus:ring-leaf-100 disabled:bg-gray-50';

const primaryButtonClass =
  'mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-leaf-600 py-2.5 text-sm font-semibold text-white hover:bg-leaf-700 disabled:bg-leaf-400';

function Spinner() {
  return (
    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
  );
}

export function ForgotPasswordPage() {
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(0);

  // Counts the resend cooldown down one second at a time.
  useEffect(() => {
    if (resendSeconds <= 0) return;

    const timer = window.setTimeout(() => setResendSeconds((s) => s - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [resendSeconds]);

  function messageFor(error: unknown): string {
    return error instanceof ApiError ? error.message : 'Something went wrong. Please try again.';
  }

  async function sendCode(isResend: boolean) {
    setErrorMessage(null);
    setNotice(null);

    const cleanEmail = email.trim().toLowerCase();

    if (!EMAIL_PATTERN.test(cleanEmail)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);

    try {
      const message = await authService.sendResetCode(cleanEmail);
      setEmail(cleanEmail);
      setNotice(message);
      setResendSeconds(RESEND_COOLDOWN_SECONDS);

      if (isResend) {
        setCode('');
      }

      setStep('code');
    } catch (error) {
      setErrorMessage(messageFor(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleEmailSubmit(event: FormEvent) {
    event.preventDefault();
    await sendCode(false);
  }

  async function handleCodeSubmit(event: FormEvent) {
    event.preventDefault();

    setErrorMessage(null);
    setNotice(null);

    if (!/^\d{6}$/.test(code)) {
      setErrorMessage('Enter the 6-digit code from the email.');
      return;
    }

    setIsSubmitting(true);

    try {
      const token = await authService.verifyResetCode(email, code);
      setResetToken(token);
      setStep('password');
    } catch (error) {
      setErrorMessage(messageFor(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handlePasswordSubmit(event: FormEvent) {
    event.preventDefault();

    setErrorMessage(null);
    setNotice(null);

    if (password.length < 8) {
      setErrorMessage('Your new password must be at least 8 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('The new password and its confirmation do not match.');
      return;
    }

    setIsSubmitting(true);

    try {
      await authService.resetPasswordWithToken(resetToken, password);
      navigate('/login', { replace: true, state: { resetDone: true } });
    } catch (error) {
      setErrorMessage(messageFor(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  function changeEmail() {
    setStep('email');
    setCode('');
    setResetToken('');
    setPassword('');
    setConfirmPassword('');
    setErrorMessage(null);
    setNotice(null);
    setResendSeconds(0);
  }

  const resendDisabled = isSubmitting || resendSeconds > 0;

  return (
    <AuthLayout>
      <h2 className="text-2xl font-bold text-gray-900">Forgot password</h2>
      <p className="mt-1 text-sm text-gray-500">
        {step === 'email' &&
          'Enter the email saved on your CAO account and we will send you a reset code.'}
        {step === 'code' &&
          `Enter the 6-digit code sent to ${email}. It expires after a few minutes.`}
        {step === 'password' && 'Code verified. Choose a new password for your account.'}
      </p>

      {notice && (
        <div className="mt-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3">
          <p className="text-sm text-green-700">{notice}</p>
        </div>
      )}

      {step === 'email' && (
        <form onSubmit={handleEmailSubmit} className="mt-6">
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@gmail.com"
            autoComplete="email"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            disabled={isSubmitting}
            className={inputClass}
          />

          <button type="submit" disabled={isSubmitting} className={primaryButtonClass}>
            {isSubmitting && <Spinner />}
            {isSubmitting ? 'Sending...' : 'Send reset code'}
          </button>
        </form>
      )}

      {step === 'code' && (
        <form onSubmit={handleCodeSubmit} className="mt-6">
          <label htmlFor="code" className="mb-1.5 block text-sm font-medium text-gray-700">
            6-digit code
          </label>
          <input
            id="code"
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="123456"
            autoComplete="one-time-code"
            disabled={isSubmitting}
            className={`${inputClass} tracking-widest`}
          />

          <button type="submit" disabled={isSubmitting} className={primaryButtonClass}>
            {isSubmitting && <Spinner />}
            {isSubmitting ? 'Verifying...' : 'Verify code'}
          </button>

          <div className="mt-4 flex items-center justify-between text-sm">
            <button
              type="button"
              disabled={resendDisabled}
              onClick={() => sendCode(true)}
              className="font-medium text-leaf-700 hover:text-leaf-800 hover:underline disabled:opacity-50 disabled:hover:no-underline"
            >
              {resendSeconds > 0 ? `Resend code (${resendSeconds}s)` : 'Resend code'}
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={changeEmail}
              className="text-gray-500 hover:text-gray-700 hover:underline disabled:opacity-50"
            >
              Use a different email
            </button>
          </div>
        </form>
      )}

      {step === 'password' && (
        <form onSubmit={handlePasswordSubmit} className="mt-6">
          <label htmlFor="new-password" className="mb-1.5 block text-sm font-medium text-gray-700">
            New password
          </label>
          <PasswordField
            id="new-password"
            value={password}
            onChange={setPassword}
            placeholder="At least 8 characters"
            autoComplete="new-password"
            disabled={isSubmitting}
          />

          <label
            htmlFor="confirm-password"
            className="mb-1.5 mt-5 block text-sm font-medium text-gray-700"
          >
            Confirm password
          </label>
          <PasswordField
            id="confirm-password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            placeholder="Re-enter the new password"
            autoComplete="new-password"
            disabled={isSubmitting}
          />

          <button type="submit" disabled={isSubmitting} className={primaryButtonClass}>
            {isSubmitting && <Spinner />}
            {isSubmitting ? 'Resetting...' : 'Reset password'}
          </button>

          <div className="mt-4 text-right text-sm">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={changeEmail}
              className="text-gray-500 hover:text-gray-700 hover:underline disabled:opacity-50"
            >
              Start over
            </button>
          </div>
        </form>
      )}

      {errorMessage && (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm text-red-700">{errorMessage}</p>
        </div>
      )}

      <p className="mt-8 text-center text-sm">
        <Link to="/login" className="font-medium text-leaf-700 hover:text-leaf-800 hover:underline">
          Back to sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
