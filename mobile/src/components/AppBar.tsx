/**
 * Compact green app bar for the inner tabs (Scan, History, Library,
 * Settings): just the screen title, in the same green as the big
 * <AppHeader>, which stays on Home only.
 *
 * It sits in normal layout flow above the screen, so scrolled content
 * disappears at its flat bottom edge instead of sliding under a curve.
 * Like <AppHeader> it handles the top safe-area inset itself.
 */

import { View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function AppBar({ title }: { title: string }) {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="bg-[#2F6D46] px-5 pb-4"
      style={{ paddingTop: insets.top + 12 }}
    >
      <Text
        accessibilityRole="header"
        numberOfLines={1}
        className="text-[20px] font-extrabold tracking-tight text-white"
      >
        {title}
      </Text>
    </View>
  );
}
