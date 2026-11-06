/**
 * A password input with a show / hide toggle.
 *
 * The icon shows the CURRENT state: eye-slash while the password is
 * hidden, eye while it is visible. The button's aria-label describes
 * the action instead (what clicking will do).
 */

import { useState } from 'react';

interface PasswordFieldProps {
  /** Not needed when the field sits inside a <label> that names it. */
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
  disabled?: boolean;
  /** The smaller look the admin forms use, instead of the sign-in card's. */
  compact?: boolean;
}

export function PasswordField({
  id,
  value,
  onChange,
  placeholder,
  autoComplete,
  disabled,
  compact,
}: PasswordFieldProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    // The compact look's top margin goes on the wrapper so the eye
    // stays vertically centred on the input, not on input + margin.
    <div className={compact ? 'relative mt-1' : 'relative'}>
      <input
        id={id}
        type={showPassword ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        disabled={disabled}
        className={
          compact
            ? 'w-full rounded-lg border border-gray-200 px-3 py-2 pr-10 text-sm focus:border-leaf-500 focus:outline-none disabled:bg-gray-50'
            : 'w-full rounded-lg border border-gray-300 px-4 py-2.5 pr-16 text-sm outline-none focus:border-leaf-600 focus:ring-2 focus:ring-leaf-100 disabled:bg-gray-50'
        }
      />
      <button
        type="button"
        onClick={() => setShowPassword((v) => !v)}
        aria-label={showPassword ? 'Hide password' : 'Show password'}
        className={`absolute top-1/2 -translate-y-1/2 text-gray-500 hover:text-leaf-700 ${
          compact ? 'right-2.5' : 'right-3'
        }`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
        >
          {showPassword ? (
            <>
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </>
          ) : (
            <>
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
              <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
              <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
              <line x1="1" y1="1" x2="23" y2="23" />
            </>
          )}
        </svg>
      </button>
    </div>
  );
}
