/**
 * A single pill-shaped input used across the sign-in and
 * create-account screens.
 *
 * Two looks, chosen with `variant`:
 *   "mist"    - filled light-green field   (sign-in screen)
 *   "outline" - white field with a hairline (create-account screen)
 *
 * A leading icon is always shown. Pass `isPassword` to get the
 * masked field plus a show / hide toggle for free.
 */

import { useState, type ComponentProps } from 'react';
import {
  View,
  TextInput,
  Pressable,
  type TextInputProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { brand } from '../constants/theme';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

type Props = TextInputProps & {
  icon: IoniconName;
  variant?: 'mist' | 'outline';
  isPassword?: boolean;
};

export function AuthTextField({
  icon,
  variant = 'mist',
  isPassword = false,
  style,
  onFocus,
  onBlur,
  ...inputProps
}: Props) {
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(isPassword);

  const borderColor = focused
    ? brand.accent
    : variant === 'mist'
      ? 'transparent'
      : brand.line;

  return (
    <View
      className={`h-14 flex-row items-center rounded-full px-[18px] ${
        variant === 'mist' ? 'bg-[#E7F4EA]' : 'bg-white'
      }`}
      style={{ borderWidth: 1.5, borderColor }}
    >
      <Ionicons name={icon} size={20} color={brand.accent} />

      <TextInput
        {...inputProps}
        secureTextEntry={isPassword ? hidden : inputProps.secureTextEntry}
        placeholderTextColor={brand.placeholder}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        className="ml-2.5 flex-1 text-[15px] text-[#16241B]"
        style={[{ paddingVertical: 0 }, style]}
      />

      {isPassword && (
        <Pressable onPress={() => setHidden((v) => !v)} hitSlop={10}>
          <Ionicons
            name={hidden ? 'eye-outline' : 'eye-off-outline'}
            size={20}
            color={brand.muted}
          />
        </Pressable>
      )}
    </View>
  );
}
