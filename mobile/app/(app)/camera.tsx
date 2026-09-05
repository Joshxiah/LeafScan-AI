/**
 * Camera Screen - live camera preview and capture.
 *
 * Route: /camera
 *
 * Uses expo-camera's CameraView. Permission is requested here
 * rather than at app startup, so the farmer is asked at the
 * moment the reason is obvious.
 */

import { useRef, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, Linking } from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useLanguage } from '../../src/context/LanguageContext';
import { colors } from '../../src/constants/theme';

export default function CameraScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const cameraRef = useRef<CameraView>(null);

  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [isCapturing, setIsCapturing] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);

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

  return (
    <View className="flex-1 bg-black">
      <CameraView
        ref={cameraRef}
        facing={facing}
        style={{ flex: 1 }}
        onCameraReady={() => setIsCameraReady(true)}
      >
        <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
          {/* ---------- Top bar ---------- */}
          <View className="flex-row items-center justify-between px-5 pt-2">
            <Pressable
              onPress={() => router.back()}
              className="h-10 w-10 items-center justify-center rounded-full bg-black/40"
            >
              <Text className="text-lg text-white">✕</Text>
            </Pressable>

            <Text className="text-sm font-medium text-white">
              {t.camera.instruction}
            </Text>

            <Pressable
              onPress={() => setFacing((f) => (f === 'back' ? 'front' : 'back'))}
              className="h-10 w-10 items-center justify-center rounded-full bg-black/40"
            >
              <Text className="text-base text-white">⟳</Text>
            </Pressable>
          </View>

          {/* ---------- Framing guide ---------- */}
          <View className="flex-1 items-center justify-center">
            <View className="aspect-square w-4/5 rounded-3xl border-2 border-white/70" />
            <Text className="mt-4 text-center text-xs text-white/80">
              {t.camera.frameHint}
            </Text>
          </View>

          {/* ---------- Shutter ---------- */}
          <View className="items-center pb-6">
            <Pressable
              onPress={handleCapture}
              disabled={isCapturing || !isCameraReady}
              className="h-20 w-20 items-center justify-center rounded-full border-4 border-white/60"
            >
              {isCapturing ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <View className="h-16 w-16 rounded-full bg-white" />
              )}
            </Pressable>

            <Text className="mt-3 text-xs text-white/70">
              {isCameraReady ? t.camera.tapToCapture : t.camera.starting}
            </Text>
          </View>
        </SafeAreaView>
      </CameraView>
    </View>
  );
}
