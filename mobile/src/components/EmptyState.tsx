/**
 * Placeholder shown on screens whose feature is reachable in the
 * UI but has no content yet (History, Disease Library, Report).
 *
 * Centres an icon, a title and a short line of explanatory text.
 */

import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { brand } from '../constants/theme';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

export default function EmptyState({
  icon,
  title,
  message,
}: {
  icon: IoniconName;
  title: string;
  message: string;
}) {
  return (
    <View className="flex-1 items-center justify-center px-10">
      <View className="h-20 w-20 items-center justify-center rounded-full bg-[#E7F4EA]">
        <Ionicons name={icon} size={34} color={brand.accent} />
      </View>

      <Text className="mt-5 text-[16px] font-extrabold text-[#16241B]">
        {title}
      </Text>
      <Text className="mt-1.5 text-center text-[13px] leading-5 text-[#6C8073]">
        {message}
      </Text>
    </View>
  );
}
