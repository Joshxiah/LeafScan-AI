/**
 * Profile page for the signed-in CAO administrator.
 *
 * Route: /profile  (opened from the avatar button in the top bar)
 *
 * Shows the account details and lets the admin fix their display
 * name and mobile number via PATCH /api/auth/me.
 */

import { useState } from 'react';

import { AdminLayout } from '../components/layout/AdminLayout';
import { ApiError } from '../services/api';
import * as authService from '../services/auth.service';
import { useAuth } from '../context/AuthContext';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function ProfilePage() {
  const { user, refreshUser } = useAuth();

  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);

  if (!user) {
    return (
      <AdminLayout title="Profile">
        <p className="text-sm text-gray-500">Not signed in.</p>
      </AdminLayout>
    );
  }

  const initials =
    user.fullName
      .split(' ')
      .map((part) => part.charAt(0))
      .slice(0, 2)
      .join('')
      .toUpperCase() || '?';

  const dirty =
    fullName.trim() !== user.fullName || phoneNumber.trim() !== (user.phoneNumber ?? '');

  async function save() {
    setError(null);
    setJustSaved(false);
    setIsSaving(true);
    try {
      await authService.updateProfile({
        fullName: fullName.trim() !== user!.fullName ? fullName.trim() : undefined,
        phoneNumber:
          phoneNumber.trim() !== (user!.phoneNumber ?? '') ? phoneNumber.trim() : undefined,
      });
      await refreshUser();
      setJustSaved(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save your profile.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <AdminLayout title="Profile">
      <div className="max-w-xl space-y-4">
        <section className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-leaf-600 text-lg font-semibold text-white">
              {initials}
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-900">{user.fullName}</p>
              <p className="text-sm text-gray-500">@{user.username} · CAO Administrator</p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Full name
              </span>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-leaf-500 focus:outline-none"
              />
            </label>

            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Mobile number
              </span>
              <input
                type="text"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="09171234567"
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-leaf-500 focus:outline-none"
              />
            </label>

            <div className="grid grid-cols-2 gap-4 pt-1 text-sm">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Username
                </p>
                <p className="mt-1 text-gray-700">@{user.username}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Email</p>
                <p className="mt-1 text-gray-700">{user.email ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Role</p>
                <p className="mt-1 text-gray-700">CAO Administrator</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Member since
                </p>
                <p className="mt-1 text-gray-700">{formatDate(user.createdAt)}</p>
              </div>
            </div>
          </div>

          {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
          {justSaved && !dirty && (
            <p className="mt-4 text-sm text-green-700">Your profile has been saved.</p>
          )}

          <button
            type="button"
            disabled={isSaving || !dirty}
            onClick={save}
            className="mt-5 rounded-lg bg-leaf-600 px-4 py-2 text-sm font-medium text-white hover:bg-leaf-700 disabled:opacity-40"
          >
            {isSaving ? 'Saving…' : 'Save changes'}
          </button>
        </section>

        <ChangePasswordCard />
      </div>
    </AdminLayout>
  );
}

/**
 * Lets the signed-in admin set a new password. The CAO issues the
 * account; from here on the admin owns their own credential.
 */
function ChangePasswordCard() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justChanged, setJustChanged] = useState(false);

  async function submit() {
    setError(null);
    setJustChanged(false);

    if (newPassword.length < 8) {
      setError('Your new password must be at least 8 characters.');
      return;
    }
    if (newPassword === currentPassword) {
      setError('Your new password must be different from your current one.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('The new password and its confirmation do not match.');
      return;
    }

    setIsSaving(true);
    try {
      await authService.changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setJustChanged(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not change your password.');
    } finally {
      setIsSaving(false);
    }
  }

  const canSubmit =
    currentPassword.length > 0 && newPassword.length > 0 && confirmPassword.length > 0;

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6">
      <h2 className="text-sm font-semibold text-gray-900">Change password</h2>
      <p className="mt-0.5 text-xs text-gray-400">
        Enter your current password, then choose a new one only you know.
      </p>

      <div className="mt-4 space-y-4">
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            Current password
          </span>
          <input
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-leaf-500 focus:outline-none"
          />
        </label>

        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            New password
          </span>
          <input
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-leaf-500 focus:outline-none"
          />
        </label>

        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            Confirm new password
          </span>
          <input
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-leaf-500 focus:outline-none"
          />
        </label>
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      {justChanged && (
        <p className="mt-4 text-sm text-green-700">Your password has been changed.</p>
      )}

      <button
        type="button"
        disabled={isSaving || !canSubmit}
        onClick={submit}
        className="mt-5 rounded-lg bg-leaf-600 px-4 py-2 text-sm font-medium text-white hover:bg-leaf-700 disabled:opacity-40"
      >
        {isSaving ? 'Changing…' : 'Change password'}
      </button>
    </section>
  );
}
