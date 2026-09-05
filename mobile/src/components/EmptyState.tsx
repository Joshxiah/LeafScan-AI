/**
 * Placeholder shown on screens whose feature is reachable in the
 * UI but has no content yet (History, Disease Library, Report), or
 * a genuine "you haven't done this yet" zero state (Home, History
 * before the farmer's first scan).
 *
 * Centres an icon, a title, a short line of explanatory text and,
 * optionally, one action button - so a zero state is an invitation
 * to do something, not a dead end.
 */

import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { brand, shadows } from '../constants/theme';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

export default function EmptyState({
  icon,
  title,
  message,
  actionLabel,
  onAction,
}: {
  icon: IoniconName;
  title: string;
  message: string;
  /** Both provided together, or not at all. */
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View className="flex-1 items-center justify-center px-10">
      <View
        className="h-20 w-20 items-center justify-center rounded-full bg-[#E7F4EA]"
        style={shadows.card}
      >
        <Ionicons name={icon} size={34} color={brand.accent} />
      </View>

      <Text className="mt-5 text-[16px] font-extrabold text-[#16241B]">
        {title}
      </Text>
      <Text className="mt-1.5 text-center text-[13px] leading-5 text-[#6C8073]">
        {message}
      </Text>

      {actionLabel && onAction && (
        <Pressable
          onPress={onAction}
          className="mt-6 h-12 flex-row items-center justify-center rounded-full bg-[#2F6D46] px-6 active:bg-[#1F4E31]"
          style={shadows.card}
        >
          <Text className="text-[14px] font-bold text-white">{actionLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}
