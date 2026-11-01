import { View, Text } from 'react-native';

export function Bullet({ text }: { text: string }) {
  return (
    <View className="flex-row">
      <Text className="text-[13px] text-[#2F6D46]">•</Text>
      <Text className="ml-2 flex-1 text-[13px] leading-5 text-[#6C8073]">
        {text}
      </Text>
    </View>
  );
}
