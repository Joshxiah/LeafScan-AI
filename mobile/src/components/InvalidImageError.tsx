/**
 * The ONE screen for a photo that fails the corn-leaf check - whichever check
 * caught it (the colour check, NOT_A_CORN_LEAF, or the model's own "not_corn",
 * NOT_CORN) and whether the phone or the server ran it.
 *
 * Top to bottom: an Android-style app bar (back arrow + "Scan result"), the red
 * banner ("We couldn't find a corn leaf"), a link that opens the photo tips, the
 * photo that was rejected, and - pinned to the bottom, inside the safe area, so
 * they are within thumb reach - exactly two ways forward. Which two depends on
 * where the photo came from:
 *
 *   camera  -> [Take another photo]  [Choose from gallery]
 *   gallery -> [Choose another photo] [Use camera instead]
 *
 * There is deliberately no "Use this photo" or "Crop" here: once a photo has
 * failed the check the farmer cannot go on with it. Nothing is saved for it.
 *
 * The wording lives in `t.invalidImage` (src/i18n/translations.ts) - edit it
 * there. This component is presentational: the screen decides what the two
 * buttons do, so the camera / gallery logic stays in one place.
 */

import { useState } from 'react';
import { View, Text, Image, Pressable, ScrollView, useWindowDimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import ActionButton from './ActionButton';
import AlertBadge from './AlertBadge';
import PhotoTipsSheet from './PhotoTipsSheet';
import { useLanguage } from '../context/LanguageContext';
import { ApiError } from '../services/api';
import { brand } from '../constants/theme';

/** True for the two errors that mean "this photo failed the corn-leaf check". */
export function isInvalidImageError(error: unknown): boolean {
  return (
    error instanceof ApiError && (error.code === 'NOT_A_CORN_LEAF' || error.code === 'NOT_CORN')
  );
}

/**
 * Most of the screen height the photo may take. The banner is long, so on a
 * small phone a full square photo would squeeze the rest; capping it keeps
 * everything in view. A normal phone is not affected (the square is already
 * shorter than this).
 */
const MAX_PHOTO_HEIGHT_FRACTION = 0.35;

export default function InvalidImageError({
  imageUri,
  source,
  onBack,
  onUseCamera,
  onUseGallery,
  isOpeningGallery = false,
  showWholePhoto = false,
}: {
  /** The local file that failed the check (never the server copy: it may be deleted). */
  imageUri: string;
  /** Where the photo came from; decides which button is the primary one. */
  source: 'camera' | 'gallery';
  /** The app bar's back arrow. */
  onBack: () => void;
  /** Open the camera. */
  onUseCamera: () => void;
  /** Open the gallery. */
  onUseGallery: () => void;
  /** The gallery is opening: the gallery button is disabled meanwhile. */
  isOpeningGallery?: boolean;
  /** A cropped photo is shown whole, so the farmer sees exactly the part they kept. */
  showWholePhoto?: boolean;
}) {
  const { t } = useLanguage();
  const { height: windowHeight } = useWindowDimensions();
  const [isTipsOpen, setIsTipsOpen] = useState(false);

  const fromCamera = source === 'camera';

  return (
    // 'top' and 'bottom': the app bar clears the status bar, and the pinned
    // buttons clear the system navigation bar / gesture area.
    <SafeAreaView className="flex-1 bg-[#F5FAF6]" edges={['top', 'bottom']}>
      {/* Light page: dark status-bar icons (the app default is light, for the green headers). */}
      <StatusBar style="dark" />

      {/* ---------- App bar ---------- */}
      <View className="h-14 flex-row items-center px-2">
        <Pressable
          onPress={onBack}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={t.common.back}
          className="h-12 w-12 items-center justify-center rounded-full active:bg-black/5"
        >
          <Ionicons name="arrow-back" size={24} color={brand.ink} />
        </Pressable>
        <Text accessibilityRole="header" className="ml-1 text-[18px] font-bold text-[#16241B]">
          {t.invalidImage.screenTitle}
        </Text>
      </View>

      <ScrollView
        contentContainerClassName="px-6 pb-6 pt-2"
        showsVerticalScrollIndicator={false}
      >
        {/* The banner grows with its text: nothing here has a fixed height, and the
            text column is flex-1 so long lines wrap inside the box. The icon is
            top-aligned with the title (items-start), not centred in the box. */}
        <View
          accessibilityRole="alert"
          className="flex-row items-start rounded-xl border border-red-200 bg-red-50 px-4 py-3"
        >
          <AlertBadge />
          <View className="ml-3 flex-1">
            <Text className="text-lg font-bold text-red-800">{t.invalidImage.title}</Text>
            <Text className="mt-1 text-sm text-red-700">{t.invalidImage.message}</Text>
          </View>
        </View>

        {/* For a farmer who is sure the photo was a corn leaf. */}
        <Pressable
          onPress={() => setIsTipsOpen(true)}
          accessibilityRole="link"
          className="min-h-[44px] justify-center self-start"
        >
          <Text className="text-[13.5px] text-[#3F5246]">
            {t.invalidImage.tipsPrompt}{' '}
            <Text className="font-bold text-leaf-700 underline">{t.invalidImage.tipsLink}</Text>
          </Text>
        </Pressable>

        <View className="mt-2 overflow-hidden rounded-2xl bg-white">
          <Image
            source={{ uri: imageUri }}
            className="aspect-square w-full"
            style={{ maxHeight: windowHeight * MAX_PHOTO_HEIGHT_FRACTION }}
            resizeMode={showWholePhoto ? 'contain' : 'cover'}
          />
        </View>
      </ScrollView>

      {/* ---------- Pinned actions ---------- */}
      <View className="border-t border-[#EEF5EF] bg-[#F5FAF6] px-6 pb-4 pt-3">
        <ActionButton
          variant="primary"
          onPress={fromCamera ? onUseCamera : onUseGallery}
          disabled={!fromCamera && isOpeningGallery}
          label={fromCamera ? t.invalidImage.takeAnother : t.preview.chooseAnother}
        />
        <ActionButton
          onPress={fromCamera ? onUseGallery : onUseCamera}
          disabled={fromCamera && isOpeningGallery}
          label={fromCamera ? t.scan.chooseFromGallery : t.invalidImage.useCameraInstead}
          className="mt-3"
        />
      </View>

      <PhotoTipsSheet visible={isTipsOpen} onClose={() => setIsTipsOpen(false)} />
    </SafeAreaView>
  );
}
