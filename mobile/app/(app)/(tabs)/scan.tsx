/**
 * Scans tab - choose how to provide a corn leaf image.
 *
 * Route: /scan
 *
 *   Camera  -> /camera   (the in-app camera)
 *   Gallery -> expo-image-picker, then straight to /preview
 */

import { useState } from 'react';
import { View, Text, Pressable, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import { useLanguage } from '../../../src/context/LanguageContext';
import { brand, shadows } from '../../../src/constants/theme';

export default function ScanScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const [isOpeningGallery, setIsOpeningGallery] = useState(false);

  async function handleChooseFromGallery() {
    setIsOpeningGallery(true);

    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(t.scan.permissionTitle, t.scan.permissionMessage);
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled) {
        return;
      }

      const asset = result.assets[0];

      if (!asset?.uri) {
        Alert.alert(t.scan.errorTitle, t.scan.errorImageUnreadable);
        return;
      }

      router.push({
        pathname: '/preview',
        params: { imageUri: asset.uri, source: 'gallery' },
      });
    } catch (error) {
      console.error('[scan] Gallery error:', error);
      Alert.alert(t.scan.errorTitle, t.scan.errorGalleryOpen);
    } finally {
      setIsOpeningGallery(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-[#F5FAF6]" edges={['top']}>
      <ScrollView
        contentContainerClassName="px-6 pb-10 pt-4"
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-2xl font-extrabold text-[#16241B]">
          {t.scan.title}
        </Text>
        <Text className="mt-1 text-[13px] text-[#6C8073]">
          {t.scan.subtitle}
        </Text>

        {/* ---------- Camera ---------- */}
        <Pressable
          onPress={() => router.push('/camera')}
          className="mt-6 flex-row items-center rounded-2xl border border-[#EEF5EF] bg-white p-5 active:bg-[#F5FAF6]"
          style={shadows.card}
        >
          <View className="h-14 w-14 items-center justify-center rounded-2xl bg-[#2F6D46]">
            <Ionicons name="camera-outline" size={26} color="#ffffff" />
          </View>

          <View className="ml-4 flex-1">
            <Text className="text-[15px] font-semibold text-[#16241B]">
              {t.scan.takePhoto}
            </Text>
            <Text className="mt-0.5 text-xs text-[#6C8073]">
              {t.scan.takePhotoDesc}
            </Text>
          </View>

          <Ionicons name="chevron-forward" size={18} color={brand.faint} />
        </Pressable>

        {/* ---------- Gallery ---------- */}
        <Pressable
          onPress={handleChooseFromGallery}
          disabled={isOpeningGallery}
          className="mt-3 flex-row items-center rounded-2xl border border-[#EEF5EF] bg-white p-5 active:bg-[#F5FAF6] disabled:opacity-70"
          style={shadows.card}
        >
          <View className="h-14 w-14 items-center justify-center rounded-2xl bg-[#E7F4EA]">
            <Ionicons name="images-outline" size={24} color={brand.accent} />
          </View>

          <View className="ml-4 flex-1">
            <Text className="text-[15px] font-semibold text-[#16241B]">
              {isOpeningGallery ? t.scan.openingGallery : t.scan.chooseFromGallery}
            </Text>
            <Text className="mt-0.5 text-xs text-[#6C8073]">
              {t.scan.chooseFromGalleryDesc}
            </Text>
          </View>

          <Ionicons name="chevron-forward" size={18} color={brand.faint} />
        </Pressable>

        {/* ---------- Guidance ---------- */}
        <View className="mt-7 rounded-2xl border border-[#DFEDE3] bg-[#E7F4EA] p-5">
          <Text className="text-[13px] font-bold text-[#1F4E31]">
            {t.scan.tipsTitle}
          </Text>

          <Tip text={t.scan.tip1} />
          <Tip text={t.scan.tip2} />
          <Tip text={t.scan.tip3} />
          <Tip text={t.scan.tip4} />
          <Tip text={t.scan.tip5} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Tip({ text }: { text: string }) {
  return (
    <View className="mt-2.5 flex-row">
      <Text className="text-[13px] text-[#2F6D46]">•</Text>
      <Text className="ml-2 flex-1 text-[13px] text-[#1F4E31]">{text}</Text>
    </View>
  );
}
