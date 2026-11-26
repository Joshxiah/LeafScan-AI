/**
 * Image Preview Screen.
 *
 * Route: /preview?imageUri=...&source=camera|gallery
 *
 * Shows the chosen image and lets the farmer retake it or send it.
 * "Use this photo" uploads the photo (POST /api/uploads), then asks
 * the server to classify it (POST /api/detections/scan), which runs
 * the real model and records the scan. The verdict is also logged to
 * src/services/scanLog.ts.
 *
 * With no internet the farmer does NOT wait for one: the same model
 * runs on the phone (src/services/onDeviceScan.ts), the result shows
 * straight away, and the photo + that result are saved in the queue
 * (src/services/pendingScans.ts). The queue uploads the photo and has
 * the server record it once the phone is back online. That is also the
 * fallback when the connection drops mid-scan. A build that cannot run
 * the model (Expo Go, web) just saves the photo for the server to scan
 * later, as before.
 */

import { useEffect, useState } from 'react';
import { View, Text, Image, Pressable, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';

import ActionButton from '../../src/components/ActionButton';
import AlertBadge from '../../src/components/AlertBadge';
import CropModal from '../../src/components/CropModal';
import InvalidImageError, { isInvalidImageError } from '../../src/components/InvalidImageError';
import { uploadLeafImage, UploadResult } from '../../src/services/upload.service';
import { getErrorMessage, ApiError } from '../../src/services/api';
import { goToDiagnosis } from '../../src/navigation/diagnosis';
import { addScan, ScanEntry } from '../../src/services/scanLog';
import { PendingScan, queuePendingScan } from '../../src/services/pendingScans';
import { scanLeaf, ScanLeafResult } from '../../src/services/detection.service';
import { isDefinitelyOffline } from '../../src/services/connectivity';
import { classifyOnDevice, warmUpOnDeviceModel } from '../../src/services/onDeviceScan';
import { useLanguage } from '../../src/context/LanguageContext';
import { useAuth } from '../../src/context/AuthContext';
import { withAuthToken } from '../../src/utils/media';
import { pickFromGallery } from '../../src/utils/pickFromGallery';

export default function PreviewScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const { token, user } = useAuth();

  // Values passed through the URL by /scan or /camera.
  const { imageUri: pickedUri, source } = useLocalSearchParams<{
    imageUri: string;
    source: string;
  }>();

  // The farmer can crop the photo before sending it. The cropped copy then
  // replaces the picked photo everywhere on this screen.
  const [croppedUri, setCroppedUri] = useState<string | null>(null);
  const [isCropOpen, setIsCropOpen] = useState(false);
  const imageUri = croppedUri ?? pickedUri;

  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // The photo failed the corn-leaf check - the colour check (NOT_A_CORN_LEAF) or the
  // model's own "not corn" (NOT_CORN), on the phone or the server. Either way the whole
  // screen becomes the one <InvalidImageError> state and nothing is saved.
  const [invalidImage, setInvalidImage] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  // The server's verdict. Set once the photo has been classified.
  const [scanResult, setScanResult] = useState<ScanLeafResult | null>(null);
  // There was no connection and this build cannot scan on the phone: the
  // photo is saved and goes to the server by itself once back online.
  const [savedOffline, setSavedOffline] = useState(false);
  // There was no connection, so the phone scanned the leaf itself. This is
  // its queue entry: the photo plus the on-device verdict, until it uploads.
  const [offlineScan, setOfflineScan] = useState<PendingScan | null>(null);
  // The phone is working through the model (a moment), as opposed to uploading.
  const [isScanningOnPhone, setIsScanningOnPhone] = useState(false);
  // The gallery is opening / open ("Choose another photo").
  const [isOpeningGallery, setIsOpeningGallery] = useState(false);

  // Load the model while the farmer looks at the photo, so the scan itself is quick.
  useEffect(() => {
    warmUpOnDeviceModel();
  }, []);

  if (!imageUri) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        {/* Light page: dark status-bar icons (the app default is light). */}
        <StatusBar style="dark" />
        <Text className="text-base text-gray-600">{t.preview.noImage}</Text>
        <Pressable onPress={() => router.replace('/camera')} className="mt-4">
          <Text className="text-base font-semibold text-leaf-700">
            {t.preview.chooseImageLink}
          </Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  async function handleUpload() {
    setErrorMessage(null);
    setInvalidImage(false);
    setIsUploading(true);

    // Where the photo already is on the server, if the upload got through
    // before the connection dropped.
    let uploadedPath = uploadResult?.imagePath;

    try {
      // No internet at all: do not even try the server. Scan on the phone now.
      if (user && (await isDefinitelyOffline())) {
        await scanOnPhone(user.id, uploadedPath);
        return;
      }

      // Keep an earlier successful upload, so a retry after a failed
      // scan does not upload the same photo twice.
      const uploaded = uploadResult ?? (await uploadLeafImage(imageUri));
      uploadedPath = uploaded.imagePath;
      setUploadResult(uploaded);

      setScanResult(await scanLeaf(uploaded.imagePath));
    } catch (error) {
      // The connection failed on the way: scan on the phone instead of
      // showing an error. Wi-Fi with no internet behind it does not fail
      // fast, it just hangs until the upload times out - treated the same,
      // but only while the photo was still uploading. A timeout during the
      // scan itself may already have been recorded by the server, so that
      // stays an error the farmer can retry (queuing it could scan the same
      // photo twice).
      const noConnection =
        error instanceof ApiError &&
        (error.code === 'NETWORK_ERROR' ||
          (error.code === 'REQUEST_TIMEOUT' && uploadedPath === undefined));
      if (user && noConnection) {
        try {
          await scanOnPhone(user.id, uploadedPath);
          return;
        } catch (offlineError) {
          showError(offlineError);
          return;
        }
      }

      showError(error);
    } finally {
      setIsUploading(false);
      setIsScanningOnPhone(false);
    }
  }

  /**
   * Scans the leaf with the on-device model and queues the photo with that
   * result, so the farmer sees a diagnosis right now and the upload happens
   * whenever there is internet. Throws for a photo that is not a leaf
   * (NOT_A_CORN_LEAF / NOT_CORN) before anything is queued, so nothing is saved
   * for it. If the phone cannot scan at all - no model in this
   * build (Expo Go, web), or it failed - the photo is just saved for the
   * server to scan later, so the farmer is never blocked.
   */
  async function scanOnPhone(userId: number, uploadedPath: string | undefined) {
    setIsScanningOnPhone(true);

    try {
      const verdict = await classifyOnDevice(imageUri);
      setOfflineScan(await queuePendingScan(userId, { imageUri, imagePath: uploadedPath, verdict }));
    } catch (error) {
      if (error instanceof ApiError) throw error; // "not a corn leaf": tell the farmer

      console.warn('[preview] Could not scan on the phone, saving the photo for later:', error);
      await queuePendingScan(userId, { imageUri, imagePath: uploadedPath });
      setSavedOffline(true);
    }
  }

  function showError(error: unknown) {
    // A failed corn-leaf check has its own screen with its own text: no red box here.
    if (isInvalidImageError(error)) {
      setInvalidImage(true);
      setErrorMessage(null);
      return;
    }

    setInvalidImage(false);
    setErrorMessage(getErrorMessage(error, t.preview.errorGeneric, t.apiErrors));
  }

  /** The farmer cropped the photo: use the new file, and forget anything tied to the old one. */
  function handleCropped(croppedFileUri: string) {
    setCroppedUri(croppedFileUri);
    // A photo uploaded earlier (e.g. before a failed scan) is the uncropped one.
    setUploadResult(null);
    setErrorMessage(null);
    setInvalidImage(false);
    setIsCropOpen(false);
  }

  /**
   * Opens the gallery right here, so the farmer picks a new photo in one tap
   * instead of going back through the Scan tab first. The screen then starts
   * over with the new photo; if they cancel, nothing changes.
   */
  async function handleChooseAnother() {
    setIsOpeningGallery(true);

    try {
      const newUri = await pickFromGallery(t.scan);
      if (!newUri) return;

      // Forget everything tied to the previous photo (crop, upload, verdicts, errors).
      setCroppedUri(null);
      setUploadResult(null);
      setScanResult(null);
      setErrorMessage(null);
      setInvalidImage(false);
      setSavedOffline(false);
      setOfflineScan(null);
      setIsScanningOnPhone(false);

      router.setParams({ imageUri: newUri, source: 'gallery' });
    } finally {
      setIsOpeningGallery(false);
    }
  }

  /** Retake with the camera, or (for a gallery photo) pick a different one from the gallery. */
  function handleRetake() {
    if (source === 'camera') {
      router.replace('/camera');
    } else {
      handleChooseAnother();
    }
  }

  async function handleDone() {
    // Scanned on the phone: the queue entry IS the saved scan (Home / History
    // list it from there), so it is not also added to the on-device log.
    if (offlineScan?.classLabel && offlineScan.confidence !== undefined) {
      goToDiagnosis(
        router,
        {
          id: `pending-${offlineScan.id}`,
          classLabel: offlineScan.classLabel,
          confidence: offlineScan.confidence,
          confidenceLevel: offlineScan.confidenceLevel,
          scannedAt: new Date(offlineScan.scannedAt),
          localUri: offlineScan.localUri,
          pending: true,
        },
        { replace: true }
      );
      return;
    }

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

  // The photo failed the corn-leaf check (either check, on the phone or the server): one
  // shared full-screen state, with its own app bar and buttons, and no way to go on with
  // this photo. Which buttons come first depends on where the photo came from: `source`
  // is the route param, and handleChooseAnother() updates it to 'gallery'.
  if (invalidImage) {
    return (
      <InvalidImageError
        imageUri={imageUri}
        source={source === 'camera' ? 'camera' : 'gallery'}
        onBack={() => router.back()}
        onUseCamera={() => router.replace('/camera')}
        onUseGallery={handleChooseAnother}
        isOpeningGallery={isOpeningGallery}
        showWholePhoto={croppedUri !== null}
      />
    );
  }

  return (
    // 'bottom' too: with edge-to-edge on Android the system nav bar would
    // otherwise sit on top of the last button (View Diagnosis).
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top', 'bottom']}>
      {/* Light page: dark status-bar icons (the app default is light, for the green headers). */}
      <StatusBar style="dark" />

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
            : offlineScan
              ? t.preview.offlineResultTitle
              : scanResult
                ? t.preview.uploadedTitle
                : t.preview.reviewTitle}
        </Text>
        <Text className="mt-1 text-sm text-gray-500">
          {savedOffline
            ? t.preview.savedOfflineSubtitle
            : offlineScan
              ? t.preview.offlineResultSubtitle
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
                uploadResult && !savedOffline && !offlineScan
                  ? withAuthToken(uploadResult.imageUrl, token)
                  : imageUri,
            }}
            className="aspect-square w-full"
            // A cropped photo is shown whole, so the farmer sees exactly the part they kept.
            resizeMode={croppedUri ? 'contain' : 'cover'}
          />
        </View>

        {/* ---------- Error ---------- */}
        {/* A failed corn-leaf check is not shown here: see <InvalidImageError> above. */}
        {errorMessage && (
          <View className="mt-5 flex-row items-center rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <AlertBadge />
            <Text className="ml-3 flex-1 text-sm text-red-700">{errorMessage}</Text>
          </View>
        )}

        {/* ---------- Upload details ---------- */}
        {uploadResult && !savedOffline && !offlineScan && (
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
              onPress={() => router.replace('/camera')}
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
        ) : !scanResult && !offlineScan ? (
          <View className="mt-7">
            <ActionButton
              onPress={handleUpload}
              disabled={isUploading}
              loading={isUploading}
              label={
                isUploading
                  ? isScanningOnPhone
                    ? t.preview.scanning
                    : t.preview.uploading
                  : t.preview.useThisImage
              }
            />

            <ActionButton
              onPress={() => setIsCropOpen(true)}
              disabled={isUploading}
              label={t.preview.crop}
              className="mt-3"
            />

            <ActionButton
              onPress={handleRetake}
              disabled={isUploading || isOpeningGallery}
              label={source === 'camera' ? t.preview.retakePhoto : t.preview.chooseAnother}
              className="mt-3"
            />
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

      <CropModal
        visible={isCropOpen}
        uri={imageUri}
        onCancel={() => setIsCropOpen(false)}
        onApply={handleCropped}
      />
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
