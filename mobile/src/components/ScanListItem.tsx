/**
 * One row representing a single scan result.
 *
 * Shared by Home ("Recent Scans"), the History tab, and anywhere
 * else a scan needs to be listed the same way: a tinted leaf icon
 * with a small outcome badge, the disease name, a crop/time
 * subtitle, and the confidence (or "Healthy") on the right.
 */

import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export function ScanListItem({
  title,
  subtitle,
  confidence,
  healthy,
  onPress,
}: {
  title: string;
  subtitle: string;
  confidence: number;
  healthy: boolean;
  onPress?: () => void;
}) {
  const tint = healthy
    ? { bg: '#E7F4EA', fg: '#2F6D46', badge: '#22A559', badgeIcon: 'checkmark' as const }
    : { bg: '#FBEDED', fg: '#D64545', badge: '#D64545', badgeIcon: 'warning' as const };

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      className="flex-row items-center rounded-2xl border border-[#EEF5EF] bg-white px-3.5 py-3 active:bg-[#F5FAF6]"
    >
      <View className="relative">
        <View
          className="h-11 w-11 items-center justify-center rounded-full"
          style={{ backgroundColor: tint.bg }}
        >
          <Ionicons name="leaf-outline" size={20} color={tint.fg} />
        </View>
        <View
          className="absolute -bottom-0.5 -right-0.5 h-4 w-4 items-center justify-center rounded-full border-2 border-white"
          style={{ backgroundColor: tint.badge }}
        >
          <Ionicons name={tint.badgeIcon} size={9} color="#ffffff" />
        </View>
      </View>

      <View className="ml-3 flex-1">
        <Text className="text-[14px] font-bold text-[#16241B]" numberOfLines={1}>
          {title}
        </Text>
        <Text className="mt-0.5 text-[12px] text-[#9BAAA1]">{subtitle}</Text>
      </View>

      <Text className="ml-2 text-[14px] font-extrabold text-[#16241B]">
        {healthy ? 'Healthy' : `${confidence}%`}
      </Text>
    </Pressable>
  );
}
