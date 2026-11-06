/**
 * Image Preview Screen.
 *
 * Route: /preview?imageUri=...&source=camera|gallery
 *
 * Shows the chosen image and lets the farmer retake it or send it.
 * "Use this image" uploads the photo (POST /api/uploads), then asks
 * the server to classify it (POST /api/detections/scan), which runs
 * the real model and records the scan. The verdict is also logged to
 * src/services/scanLog.ts. Classifying needs the server, so with no
 * connection the photo is saved on the phone instead
 * (src/services/pendingScans.ts) and uploaded + classified
 * automatically once the phone is back online - the farmer is never
 * shown a made-up result in the meantime.
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
import { getErrorMessage, ApiError } from '../../src/services/api';
import { goToDiagnosis } from '../../src/navigation/diagnosis';
import { addScan, ScanEntry } from '../../src/services/scanLog';
import { queuePendingScan } from '../../src/services/pendingScans';
import { scanLeaf, ScanLeafResult } from '../../src/services/detection.service';
import { useLanguage } from '../../src/context/LanguageContext';
import { useAuth } from '../../src/context/AuthContext';
import { withAuthToken } from '../../src/utils/media';

export default function PreviewScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const { token, user } = useAuth();

  // Values passed through the URL by /scan or /camera.
  const { imageUri, source } = useLocalSearchParams<{
    imageUri: string;
    source: string;
  }>();

  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // The server read the photo fine but it is not a corn leaf. Shown as a
  // gentle "try again" note instead of a red error.
  const [notCornLeaf, setNotCornLeaf] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  // The server's verdict. Set once the photo has been classified.
  const [scanResult, setScanResult] = useState<ScanLeafResult | null>(null);
  // There was no connection: the photo is saved on the phone and goes to
  // the server by itself once the phone is back online.
  const [savedOffline, setSavedOffline] = useState(false);

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
    setNotCornLeaf(false);
    setIsUploading(true);

    // Where the photo already is on the server, if the upload got through
    // before the connection dropped.
    let uploadedPath = uploadResult?.imagePath;

    try {
      // Keep an earlier successful upload, so a retry after a failed
      // scan does not upload the same photo twice.
      const uploaded = uploadResult ?? (await uploadLeafImage(imageUri));
      uploadedPath = uploaded.imagePath;
      setUploadResult(uploaded);

      setScanResult(await scanLeaf(uploaded.imagePath));
    } catch (error) {
      // No connection at all: keep the photo on the phone and let
      // PendingScanSync send it later, instead of showing an error.
      // Wi-Fi with no internet behind it does not fail fast, it just hangs
      // until the upload times out - treated the same, but only while the
      // photo was still uploading. A timeout during the scan itself may
      // already have been recorded by the server, so that stays an error
      // the farmer can retry (queuing it could scan the same photo twice).
      const noConnection =
        error instanceof ApiError &&
        (error.code === 'NETWORK_ERROR' ||
          (error.code === 'REQUEST_TIMEOUT' && uploadedPath === undefined));
      if (user && noConnection) {
        try {
          await queuePendingScan(user.id, { imageUri, imagePath: uploadedPath });
          setSavedOffline(true);
          return;
        } catch (queueError) {
          console.error('[preview] Could not save the scan offline:', queueError);
        }
      }

      setNotCornLeaf(error instanceof ApiError && error.code === 'NOT_A_CORN_LEAF');
      setErrorMessage(getErrorMessage(error, t.preview.errorGeneric, t.apiErrors));
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
    if (!scanResult) return;

    // The server already recorded this scan when it classified it; the
    // on-device log is just the offline fallback for Home / History.
    let scan: ScanEntry = {
      id: `${Date.now()}`,
      classLabel: scanResult.classLabel,
      confidence: scanResult.confidence,
      confidenceLevel: scanResult.confidenceLevel,
      riskLevel: scanResult.riskLevel,
      scannedAt: new Date(),
      imagePath: uploadResult?.imagePath,
      imageUrl: uploadResult?.imageUrl,
    };
    if (user) scan = await addScan(user.id, scan);

    // Show the farmer's own photo on the Diagnosis screen.
    goToDiagnosis(router, { ...scan, localUri: imageUri }, { replace: true });
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
          {savedOffline
            ? t.preview.savedOfflineTitle
            : scanResult
              ? t.preview.uploadedTitle
              : t.preview.reviewTitle}
        </Text>
        <Text className="mt-1 text-sm text-gray-500">
          {savedOffline
            ? t.preview.savedOfflineSubtitle
            : scanResult
              ? t.preview.uploadedSubtitle
              : t.preview.reviewSubtitle}
        </Text>

        {/* ---------- The image ---------- */}
        <View className="mt-6 overflow-hidden rounded-2xl bg-white">
          <Image
            // Once uploaded, show the SERVER copy. If this renders,
            // the file genuinely arrived and is readable. Saved offline,
            // the server copy cannot be loaded, so show the local photo.
            source={{
              uri:
                uploadResult && !savedOffline
                  ? withAuthToken(uploadResult.imageUrl, token)
                  : imageUri,
            }}
            className="aspect-square w-full"
            resizeMode="cover"
          />
        </View>

        {/* ---------- Error ---------- */}
        {errorMessage &&
          (notCornLeaf ? (
            <View className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <Text className="text-sm text-amber-800">{errorMessage}</Text>
            </View>
          ) : (
            <View className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <Text className="text-sm text-red-700">{errorMessage}</Text>
            </View>
          ))}

        {/* ---------- Upload details ---------- */}
        {uploadResult && !notCornLeaf && !savedOffline && (
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
        {savedOffline ? (
          <View className="mt-7">
            <Pressable
              onPress={() => router.replace('/scan')}
              className="items-center rounded-xl bg-leaf-600 py-4 active:bg-leaf-700"
            >
              <Text className="text-base font-semibold text-white">
                {t.preview.scanAnother}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => router.replace('/home')}
              className="mt-3 items-center rounded-xl border-2 border-leaf-600 py-4 active:bg-leaf-50"
            >
              <Text className="text-base font-semibold text-leaf-700">
                {t.preview.backToHome}
              </Text>
            </Pressable>
          </View>
        ) : !scanResult ? (
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
