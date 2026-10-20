/**
 * Green banner header shown at the top of every tab: the LeafScan AI
 * mark, the product name and what it does, on a green panel with
 * rounded bottom corners and soft decorative circles. Handles the
 * top safe-area inset itself, so tab screens do not.
 */

import { View, Text, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function AppHeader() {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="overflow-hidden bg-[#2F6D46] px-5 pb-5"
      style={{
        paddingTop: insets.top + 12,
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
      }}
    >
      {/* Decorative circles */}
      <View
        className="absolute rounded-full bg-white/10"
        style={{ width: 150, height: 150, right: -40, top: -50 }}
      />
      <View
        className="absolute rounded-full bg-white/10"
        style={{ width: 90, height: 90, right: 60, bottom: -45 }}
      />

      <View className="flex-row items-center">
        <View className="h-12 w-12 items-center justify-center rounded-full bg-white">
          <Image
            source={require('../../assets/images/logo.png')}
            style={{ width: 34, height: 34 }}
            resizeMode="contain"
          />
        </View>
        <View className="ml-3 flex-1">
          <Text className="text-[20px] font-extrabold tracking-tight text-white">
            LeafScan AI
          </Text>
          <Text className="mt-0.5 text-[12px] text-white/80" numberOfLines={1}>
            Corn Leaf Disease Detection
          </Text>
        </View>
      </View>
    </View>
  );
}
