/**
 * The pill-shaped search field used at the top of History and the
 * Disease Library ("Search past scans" / "Search diseases").
 */

import { View, TextInput, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { brand } from '../constants/theme';

export function SearchInput({
  value,
  onChangeText,
  placeholder,
}: {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
}) {
  return (
    <View className="h-12 flex-row items-center rounded-full border border-[#DFEDE3] bg-white px-4">
      <Ionicons name="search-outline" size={18} color={brand.muted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={brand.placeholder}
        autoCapitalize="none"
        autoCorrect={false}
        underlineColorAndroid="transparent"
        selectionColor={brand.accent}
        className="ml-2.5 flex-1 text-[14px] text-[#16241B]"
        style={[{ paddingVertical: 0 }, Platform.OS === 'web' && ({ outlineStyle: 'none' } as object)]}
      />
    </View>
  );
}
