/**
 * A small elevated card showing one labelled number.
 *
 * Used for the Home dashboard's Healthy / Diseased pair and the
 * CAO report's Total / Affected / Healthy trio - same shape,
 * different counts, so one component covers both.
 */

import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { shadows } from '../constants/theme';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

export function StatCard({
  icon,
  iconColor = '#6C8073',
  label,
  value,
  valueColor = '#16241B',
}: {
  icon: IoniconName;
  iconColor?: string;
  label: string;
  value: string | number;
  valueColor?: string;
}) {
  return (
    <View
      className="flex-1 rounded-2xl border border-[#EEF5EF] bg-white px-4 py-4"
      style={shadows.card}
    >
      <View className="flex-row items-center">
        <Ionicons name={icon} size={13} color={iconColor} />
        <Text
          className="ml-1.5 text-[11px] font-bold tracking-wide"
          style={{ color: iconColor }}
        >
          {label.toUpperCase()}
        </Text>
      </View>
      <Text className="mt-2 text-[26px] font-extrabold" style={{ color: valueColor }}>
        {value}
      </Text>
    </View>
  );
}
