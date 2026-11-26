/**
 * Green-outlined button. Two looks:
 *
 *   secondary (default) - white with a green outline. Pressing it fills it
 *                         green and turns the text white (there is no hover on
 *                         a phone, so the press is the effect).
 *   primary             - filled green with white text; darker while pressed.
 *
 * Used by the Preview screen, <InvalidImageError> and <PhotoTipsSheet>.
 */

import { useEffect, useRef, useState } from 'react';
import { Text, Pressable, ActivityIndicator } from 'react-native';

export default function ActionButton({
  label,
  onPress,
  disabled,
  loading,
  variant = 'secondary',
  className = '',
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary';
  className?: string;
}) {
  // Own press state instead of the `active:` variant. A quick tap on some of
  // these buttons leaves the screen straight away (e.g. Retake Photo), so the
  // green is held ~150 ms after the finger lifts to make sure it is seen.
  const [isPressed, setIsPressed] = useState(false);
  const releaseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (releaseTimer.current) clearTimeout(releaseTimer.current);
    };
  }, []);

  function handlePressIn() {
    if (releaseTimer.current) clearTimeout(releaseTimer.current);
    setIsPressed(true);
  }

  function handlePressOut() {
    releaseTimer.current = setTimeout(() => setIsPressed(false), 150);
  }

  const isPrimary = variant === 'primary';
  const background = isPrimary
    ? isPressed
      ? 'border-leaf-700 bg-leaf-700'
      : 'border-leaf-600 bg-leaf-600'
    : isPressed
      ? 'border-leaf-600 bg-leaf-600'
      : 'border-leaf-600 bg-white';
  const filledText = isPrimary || isPressed;

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      accessibilityRole="button"
      className={`flex-row items-center justify-center rounded-xl border-2 py-4 ${background} ${
        disabled ? 'opacity-60' : ''
      } ${className}`}
    >
      {loading && (
        <ActivityIndicator
          size="small"
          color={filledText ? '#ffffff' : '#2a752c'}
          className="mr-2"
        />
      )}
      <Text
        className={`text-base font-semibold ${filledText ? 'text-white' : 'text-leaf-700'}`}
      >
        {label}
      </Text>
    </Pressable>
  );
}
