/**
 * Notice on Home for photos that were taken offline and are still
 * waiting to reach the server. They have no diagnosis yet (the server
 * classifies them once the phone is back online), so they are not in
 * Recent Scans - this is how the farmer knows they were not lost.
 * Renders nothing when there is none waiting.
 */

import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useLanguage } from '../context/LanguageContext';

export function PendingScansNotice({ count }: { count: number }) {
  const { t } = useLanguage();

  if (count <= 0) return null;

  return (
    <View className="mt-5 flex-row items-center rounded-2xl border border-amber-200 bg-amber-50 p-4">
      <View className="h-9 w-9 items-center justify-center rounded-full bg-amber-100">
        <Ionicons name="cloud-upload-outline" size={18} color="#92400E" />
      </View>
      <Text className="ml-3 flex-1 text-[12.5px] leading-5 text-amber-800">
        {t.home.pendingScans(count)}
      </Text>
    </View>
  );
}
