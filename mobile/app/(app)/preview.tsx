/**
 * Image Preview Screen.
 *
 * Route: /preview?imageUri=...&source=camera|gallery
 *
 * Shows the chosen image and lets the farmer retake it or send it.
 * In Phase 13 the upload here is replaced by a call to
 * POST /api/detections, which uploads AND runs the AI model in one
 * request. Until then, "View Diagnosis" hands off to a mock
 * classifier - see pickMockDiagnosis() in src/data/scanStats.ts -
 * and the result is logged to src/services/scanLog.ts, so it is
 * still there the next time Home or History load.
 */

import { useState } from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { uploadLeafImage, UploadResult } from '../../src/services/upload.service';
import { ApiError } from '../../src/services/api';
import { goToDiagnosis } from '../../src/navigation/diagnosis';
import { pickMockDiagnosis } from '../../src/data/scanStats';
import { addScan } from '../../src/services/scanLog';
import { useLanguage } from '../../src/context/LanguageContext';

export default function PreviewScreen() {
  const router = useRouter();
  const { t } = useLanguage();

  // Values passed through the URL by /scan or /camera.
  const { imageUri, source } = useLocalSearchParams<{
    imageUri: string;
    source: string;
  }>();

  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);

  if (!imageUri) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <Text className="text-base text-gray-600">{t.preview.noImage}</Text>
        <Pressable onPress={() => router.replace('/scan')} className="mt-4">
          <Text className="text-base font-semibold text-leaf-700">
            {t.preview.chooseImageLink}
          </Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  async function handleUpload() {
    setErrorMessage(null);
    setIsUploading(true);

    try {
      const result = await uploadLeafImage(imageUri);
      setUploadResult(result);
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage(t.preview.errorGeneric);
      }
    } finally {
      setIsUploading(false);
    }
  }

  /** Sends the farmer back to pick or capture a different image. */
  function handleRetake() {
    if (source === 'camera') {
      router.replace('/camera');
    } else {
      router.replace('/scan');
    }
  }

  async function handleDone() {
    const { classLabel, confidence } = pickMockDiagnosis();
    const scan = await addScan({ classLabel, confidence, scannedAt: new Date() });
    goToDiagnosis(router, scan, { replace: true });
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      <ScrollView
        contentContainerClassName="px-6 pb-10 pt-4"
        showsVerticalScrollIndicator={false}
      >
        <Pressable onPress={() => router.back()} hitSlop={10} disabled={isUploading}>
          <Text className="text-base text-leaf-700">{t.preview.backLink}</Text>
        </Pressable>

        <Text className="mt-5 text-2xl font-bold text-gray-900">
          {uploadResult ? t.preview.uploadedTitle : t.preview.reviewTitle}
        </Text>
        <Text className="mt-1 text-sm text-gray-500">
          {uploadResult ? t.preview.uploadedSubtitle : t.preview.reviewSubtitle}
        </Text>

        {/* ---------- The image ---------- */}
        <View className="mt-6 overflow-hidden rounded-2xl bg-white">
          <Image
            // Once uploaded, show the SERVER copy. If this renders,
            // the file genuinely arrived and is readable.
            source={{ uri: uploadResult ? uploadResult.imageUrl : imageUri }}
            className="aspect-square w-full"
            resizeMode="cover"
          />
        </View>

        {/* ---------- Error ---------- */}
        {errorMessage && (
          <View className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <Text className="text-sm text-red-700">{errorMessage}</Text>
          </View>
        )}

        {/* ---------- Upload details ---------- */}
        {uploadResult && (
          <View className="mt-5 rounded-2xl bg-white p-5">
            <Text className="mb-3 text-base font-semibold text-gray-900">
              {t.preview.uploadDetails}
            </Text>

            <DetailRow label={t.preview.fileName} value={uploadResult.fileName} />
            <DetailRow
              label={t.preview.size}
              value={`${(uploadResult.sizeBytes / 1024).toFixed(0)} KB`}
            />
            <DetailRow label={t.preview.type} value={uploadResult.mimeType} />
            <DetailRow label={t.preview.storedAt} value={uploadResult.imagePath} isLast />
          </View>
        )}

        {/* ---------- Actions ---------- */}
        {!uploadResult ? (
          <View className="mt-7">
            <Pressable
              onPress={handleUpload}
              disabled={isUploading}
              className={`flex-row items-center justify-center rounded-xl py-4 ${
                isUploading ? 'bg-leaf-400' : 'bg-leaf-600 active:bg-leaf-700'
              }`}
            >
              {isUploading && (
                <ActivityIndicator size="small" color="#ffffff" className="mr-2" />
              )}
              <Text className="text-base font-semibold text-white">
                {isUploading ? t.preview.uploading : t.preview.useThisImage}
              </Text>
            </Pressable>

            <Pressable
              onPress={handleRetake}
              disabled={isUploading}
              className="mt-3 items-center rounded-xl border-2 border-leaf-600 py-4 active:bg-leaf-50"
            >
              <Text className="text-base font-semibold text-leaf-700">
                {source === 'camera' ? t.preview.retakePhoto : t.preview.chooseAnother}
              </Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            onPress={handleDone}
            className="mt-7 items-center rounded-xl bg-leaf-600 py-4 active:bg-leaf-700"
          >
            <Text className="text-base font-semibold text-white">
              {t.preview.viewDiagnosis}
            </Text>
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function DetailRow({
  label,
  value,
  isLast,
}: {
  label: string;
  value: string;
  isLast?: boolean;
}) {
  return (
    <View
      className={`flex-row items-start justify-between ${
        isLast ? '' : 'mb-2.5 border-b border-gray-100 pb-2.5'
      }`}
    >
      <Text className="text-xs text-gray-500">{label}</Text>
      <Text className="ml-4 flex-1 text-right text-xs font-medium text-gray-900">
        {value}
      </Text>
    </View>
  );
}
