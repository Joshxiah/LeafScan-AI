/**
 * Bottom sheet with the photo tips ("Tips for a clear scan"). Opened from the
 * link on the rejection screen, for a farmer who is sure the photo was a corn
 * leaf. The first three tips are the same ones shown over the camera.
 *
 * Tap the dimmed area, the button or the Android back button to close it.
 */

import { Modal, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ActionButton from './ActionButton';
import { useLanguage } from '../context/LanguageContext';
import { brand } from '../constants/theme';

export default function PhotoTipsSheet({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const tips = [t.scan.tip1, t.scan.tip2, t.scan.tip3, t.scan.tip4, t.scan.tip5];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      // Edge-to-edge Android: let the dimmed area reach under the status bar.
      statusBarTranslucent
    >
      <View className="flex-1 justify-end bg-black/40">
        {/* The dimmed area above the sheet closes it. */}
        <Pressable
          className="flex-1"
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={t.scan.tipsGotIt}
        />

        <View
          className="rounded-t-3xl bg-white px-6 pt-3"
          style={{ paddingBottom: Math.max(insets.bottom, 16) + 8 }}
        >
          <View className="mb-4 h-1 w-10 self-center rounded-full bg-[#DFEDE3]" />

          <Text accessibilityRole="header" className="text-[17px] font-bold text-[#16241B]">
            {t.scan.tipsTitle}
          </Text>

          <View className="mt-3 gap-3">
            {tips.map((tip) => (
              <View key={tip} className="flex-row items-start">
                <Ionicons name="checkmark-circle" size={18} color={brand.accent} />
                <Text className="ml-2.5 flex-1 text-[14px] leading-5 text-[#3F5246]">{tip}</Text>
              </View>
            ))}
          </View>

          <ActionButton
            variant="primary"
            label={t.scan.tipsGotIt}
            onPress={onClose}
            className="mt-6"
          />
        </View>
      </View>
    </Modal>
  );
}
