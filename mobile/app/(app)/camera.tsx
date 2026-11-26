/**
 * Camera Screen - live camera preview and capture. This is the Scan screen:
 * the raised Scan button in the tab bar opens it directly.
 *
 * Route: /camera
 *
 *   Shutter -> /preview (source: camera)
 *   Gallery -> expo-image-picker, then /preview (source: gallery). It sits next
 *              to the shutter, and on the permission screen too, so a farmer who
 *              has not allowed the camera can still pick a photo.
 *
 * Uses expo-camera's CameraView. Permission is requested here
 * rather than at app startup, so the farmer is asked at the
 * moment the reason is obvious.
 */

import { useRef, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, Linking, StyleSheet } from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import ActionButton from '../../src/components/ActionButton';
import { useLanguage } from '../../src/context/LanguageContext';
import { pickFromGallery } from '../../src/utils/pickFromGallery';
import { colors } from '../../src/constants/theme';

/** Size and thickness of the corner marks of the framing guide. */
const CORNER_SIZE = 32;
const CORNER_WIDTH = 4;
const CORNER_RADIUS = 16;

/** One corner mark of the framing guide (an "L" in the given corner of its parent). */
function Corner({ position }: { position: 'tl' | 'tr' | 'bl' | 'br' }) {
  const isTop = position[0] === 't';
  const isLeft = position[1] === 'l';

  return (
    <View
      style={{
        position: 'absolute',
        width: CORNER_SIZE,
        height: CORNER_SIZE,
        top: isTop ? 0 : undefined,
        bottom: isTop ? undefined : 0,
        left: isLeft ? 0 : undefined,
        right: isLeft ? undefined : 0,
        borderColor: colors.white,
        borderTopWidth: isTop ? CORNER_WIDTH : 0,
        borderBottomWidth: isTop ? 0 : CORNER_WIDTH,
        borderLeftWidth: isLeft ? CORNER_WIDTH : 0,
        borderRightWidth: isLeft ? 0 : CORNER_WIDTH,
        borderTopLeftRadius: isTop && isLeft ? CORNER_RADIUS : 0,
        borderTopRightRadius: isTop && !isLeft ? CORNER_RADIUS : 0,
        borderBottomLeftRadius: !isTop && isLeft ? CORNER_RADIUS : 0,
        borderBottomRightRadius: !isTop && !isLeft ? CORNER_RADIUS : 0,
      }}
    />
  );
}

export default function CameraScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const cameraRef = useRef<CameraView>(null);

  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [isCapturing, setIsCapturing] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  // The gallery is opening / open.
  const [isOpeningGallery, setIsOpeningGallery] = useState(false);

  /** Still loading the current permission status. */
  if (!permission) {
    return (
      <View className="flex-1 items-center justify-center bg-black">
        <ActivityIndicator size="large" color={colors.white} />
      </View>
    );
  }

  /** Permission not granted yet, or denied. */
  if (!permission.granted) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
        {/* White screen: dark status-bar icons (the app default is light). */}
        <StatusBar style="dark" />
        <View className="flex-1 items-center justify-center px-8">
          <View className="h-20 w-20 items-center justify-center rounded-3xl bg-leaf-50">
            <Text className="text-3xl">📷</Text>
          </View>

          <Text className="mt-6 text-center text-xl font-bold text-gray-900">
            {t.camera.permissionTitle}
          </Text>

          <Text className="mt-2 text-center text-sm text-gray-500">
            {t.camera.permissionMessage}
          </Text>

          {/* canAskAgain is false once the user has permanently
              denied, so we send them to system settings instead. */}
          {permission.canAskAgain ? (
            <Pressable
              onPress={requestPermission}
              className="mt-8 w-full items-center rounded-xl bg-leaf-600 py-4 active:bg-leaf-700"
            >
              <Text className="text-base font-semibold text-white">
                {t.camera.allowAccess}
              </Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={() => Linking.openSettings()}
              className="mt-8 w-full items-center rounded-xl bg-leaf-600 py-4 active:bg-leaf-700"
            >
              <Text className="text-base font-semibold text-white">
                {t.camera.openSettings}
              </Text>
            </Pressable>
          )}

          <ActionButton
            onPress={handleChooseFromGallery}
            disabled={isOpeningGallery}
            label={t.scan.chooseFromGallery}
            className="mt-3 w-full"
          />

          <Pressable onPress={() => router.back()} className="mt-3 py-3">
            <Text className="text-sm text-gray-500">{t.camera.goBack}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  async function handleCapture() {
    if (!cameraRef.current || isCapturing || !isCameraReady) {
      return;
    }

    setIsCapturing(true);

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        skipProcessing: false,
      });

      if (!photo?.uri) {
        return;
      }

      router.replace({
        pathname: '/preview',
        params: { imageUri: photo.uri, source: 'camera' },
      });
    } catch (error) {
      console.error('[camera] Capture failed:', error);
    } finally {
      setIsCapturing(false);
    }
  }

  /** Pick a photo from the gallery instead of taking one. No crop step: /preview offers it. */
  async function handleChooseFromGallery() {
    if (isOpeningGallery || isCapturing) return;

    setIsOpeningGallery(true);

    try {
      const imageUri = await pickFromGallery(t.scan);
      if (!imageUri) return;

      router.replace({
        pathname: '/preview',
        params: { imageUri, source: 'gallery' },
      });
    } finally {
      setIsOpeningGallery(false);
    }
  }

  return (
    <View className="flex-1 bg-black">
      {/* CameraView does not accept children - the controls are an
          absolutely-positioned overlay sibling on top of it. */}
      <CameraView
        ref={cameraRef}
        facing={facing}
        style={StyleSheet.absoluteFill}
        onCameraReady={() => setIsCameraReady(true)}
      />

      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        <SafeAreaView className="flex-1" edges={['top', 'bottom']} pointerEvents="box-none">
          {/* ---------- Top bar ---------- */}
          <View className="flex-row items-center justify-between px-5 pt-2">
            <Pressable
              onPress={() => router.back()}
              hitSlop={8}
              accessibilityLabel={t.common.back}
              className="h-10 w-10 items-center justify-center rounded-full bg-black/50 active:bg-black/70"
            >
              <Ionicons name="close" size={22} color={colors.white} />
            </Pressable>

            <Text accessibilityRole="header" className="text-sm font-medium text-white">
              {t.scan.title}
            </Text>

            <Pressable
              onPress={() => setFacing((f) => (f === 'back' ? 'front' : 'back'))}
              hitSlop={8}
              className="h-10 w-10 items-center justify-center rounded-full bg-black/50 active:bg-black/70"
            >
              <Ionicons name="camera-reverse-outline" size={22} color={colors.white} />
            </Pressable>
          </View>

          {/* ---------- Corn-only note + photo tips ----------
              A small overlay, moved here from the old Scan screen: this is where the
              farmer now picks (camera or gallery) and frames the leaf, so it is the
              one place every farmer sees the corn-only note. The note is information,
              not an error, so it is amber with an "i" (red is for real errors). */}
          <View className="mx-5 mt-3 overflow-hidden rounded-2xl" pointerEvents="none">
            <View className="flex-row items-start bg-[#FFF6E0] px-4 py-2.5">
              <Ionicons
                name="information-circle"
                size={16}
                color="#9A6B00"
                style={{ marginTop: 1 }}
              />
              <View className="ml-2 flex-1">
                <Text className="text-[12.5px] font-bold text-[#7A5600]">
                  {t.scan.cornOnlyTitle}
                </Text>
                <Text className="text-[12px] leading-4 text-[#7A5600]">
                  {t.scan.cornOnlyBody}
                </Text>
              </View>
            </View>

            <View className="bg-black/55 px-4 py-3">
              {[t.scan.tip1, t.scan.tip2, t.scan.tip3].map((tip, index) => (
                <View key={tip} className={`flex-row items-center ${index > 0 ? 'mt-1.5' : ''}`}>
                  <Ionicons name="checkmark-circle" size={14} color={colors.leaf[300]} />
                  <Text className="ml-2 flex-1 text-[12.5px] text-white">{tip}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* ---------- Framing guide ---------- */}
          <View className="flex-1 items-center justify-center" pointerEvents="none">
            {/* maxHeight keeps it clear of the tips on a short screen. */}
            <View
              className="aspect-square w-4/5 rounded-3xl border border-white/25"
              style={{ maxHeight: '100%' }}
            >
              <Corner position="tl" />
              <Corner position="tr" />
              <Corner position="bl" />
              <Corner position="br" />
            </View>
          </View>

          {/* ---------- Gallery + shutter ----------
              Three equal slots so the shutter stays centred: gallery on the
              left, the right one is empty. The captions share a row so they
              line up under their buttons. */}
          <View className="px-6 pb-6">
            <View className="flex-row items-center justify-between">
              <View className="w-24 items-center">
                <Pressable
                  onPress={handleChooseFromGallery}
                  disabled={isOpeningGallery || isCapturing}
                  accessibilityRole="button"
                  accessibilityLabel={t.scan.chooseFromGallery}
                  className={`h-12 w-12 items-center justify-center rounded-full bg-black/50 active:bg-black/70 ${
                    isOpeningGallery ? 'opacity-60' : ''
                  }`}
                >
                  <Ionicons name="images-outline" size={22} color={colors.white} />
                </Pressable>
              </View>

              <Pressable
                onPress={handleCapture}
                disabled={isCapturing || !isCameraReady}
                accessibilityRole="button"
                accessibilityLabel={t.camera.tapToCapture}
                className="h-20 w-20 items-center justify-center rounded-full border-4 border-white/60"
              >
                {isCapturing ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <View className="h-16 w-16 rounded-full bg-white" />
                )}
              </Pressable>

              <View className="w-24" />
            </View>

            <View className="mt-2 flex-row items-start justify-between">
              <Text numberOfLines={2} className="w-24 text-center text-[11px] text-white/80">
                {t.scan.chooseFromGallery}
              </Text>
              <Text className="text-xs text-white/70">
                {isCameraReady ? t.camera.tapToCapture : t.camera.starting}
              </Text>
              <View className="w-24" />
            </View>
          </View>
        </SafeAreaView>
      </View>
    </View>
  );
}
