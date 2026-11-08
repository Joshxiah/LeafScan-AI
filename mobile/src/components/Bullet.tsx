import { View, Text } from 'react-native';

/** `justify` aligns the text flush on both sides; off by default so other screens look as before. */
export function Bullet({ text, justify = false }: { text: string; justify?: boolean }) {
  return (
    <View className="flex-row">
      <Text className="text-[13px] text-[#2F6D46]">•</Text>
      <Text
        className={`ml-2 flex-1 text-[13px] leading-5 text-[#6C8073] ${justify ? 'text-justify' : ''}`}
      >
        {text}
      </Text>
    </View>
  );
}
