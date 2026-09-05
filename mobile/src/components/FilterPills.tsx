/**
 * A row of pill filters where exactly one is active at a time -
 * History's All / Diseased / Healthy, and anywhere else that shape
 * of filter is needed.
 */

import { View, Text, Pressable } from 'react-native';

export function FilterPills<T extends string>({
  options,
  value,
  onChange,
  getLabel = (option) => option,
}: {
  options: readonly T[];
  value: T;
  onChange: (option: T) => void;
  /** Text to display for an option, when it differs from its value (e.g. a translation). */
  getLabel?: (option: T) => string;
}) {
  return (
    <View className="flex-row gap-2">
      {options.map((option) => {
        const active = option === value;
        return (
          <Pressable
            key={option}
            onPress={() => onChange(option)}
            className={`rounded-full px-4 py-2 ${
              active ? 'bg-[#2F6D46]' : 'border border-[#DFEDE3] bg-white'
            }`}
          >
            <Text
              className={`text-[13px] font-semibold ${
                active ? 'text-white' : 'text-[#6C8073]'
              }`}
            >
              {getLabel(option)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
