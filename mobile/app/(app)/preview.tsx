/**
 * Image Preview Screen.
 *
 * Route: /preview?imageUri=...&source=camera|gallery
 *
 * Shows the chosen image and lets the farmer retake it or send it.
 * "Use this image" uploads the photo (POST /api/uploads), then asks
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

import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import CropModal from '../../src/components/CropModal';
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
  // The server read the photo fine but it is not a corn leaf. Shown as a
  // gentle "try again" note instead of a red error.
  const [notCornLeaf, setNotCornLeaf] = useState(false);
  // The model itself said "not corn" (code NOT_CORN). Unlike the note above this
  // swaps the whole screen for a friendly "not a corn leaf" one; nothing is saved.
  const [notCorn, setNotCorn] = useState(false);
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
  // The gallery is opening / open ("Choose Another Image").
  const [isOpeningGallery, setIsOpeningGallery] = useState(false);

  // Load the model while the farmer looks at the photo, so the scan itself is quick.
  useEffect(() => {
    warmUpOnDeviceModel();
  }, []);

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
    setNotCorn(false);
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
   * (NOT_A_CORN_LEAF). If the phone cannot scan at all - no model in this
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
    setNotCornLeaf(error instanceof ApiError && error.code === 'NOT_A_CORN_LEAF');
    setNotCorn(error instanceof ApiError && error.code === 'NOT_CORN');
    setErrorMessage(getErrorMessage(error, t.preview.errorGeneric, t.apiErrors));
  }

  /** The farmer cropped the photo: use the new file, and forget anything tied to the old one. */
  function handleCropped(croppedFileUri: string) {
    setCroppedUri(croppedFileUri);
    // A photo uploaded earlier (e.g. before a failed scan) is the uncropped one.
    setUploadResult(null);
    setErrorMessage(null);
    setNotCornLeaf(false);
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
      setNotCornLeaf(false);
      setNotCorn(false);
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

  return (
    // 'bottom' too: with edge-to-edge on Android the system nav bar would
    // otherwise sit on top of the last button (View Diagnosis).
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top', 'bottom']}>
      <ScrollView
        contentContainerClassName="px-6 pb-10 pt-4"
        showsVerticalScrollIndicator={false}
      >
        <Pressable onPress={() => router.back()} hitSlop={10} disabled={isUploading}>
          <Text className="text-base text-leaf-700">{t.preview.backLink}</Text>
        </Pressable>

        {/* Not a corn leaf (either check): no title + subtitle here, the red box sits above the image. */}
        {!notCorn && !notCornLeaf && (
          <>
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
          </>
        )}

        {/* Not a corn leaf: the disclaimer goes ABOVE the image so it is read first. */}
        {notCorn && (
          <View className="mt-5 flex-row items-center rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <AlertBadge />
            <View className="ml-3 flex-1">
              <Text className="text-lg font-bold text-red-800">{t.preview.notCornTitle}</Text>
              <Text className="mt-1 text-sm text-red-700">{t.preview.notCornMessage}</Text>
            </View>
          </View>
        )}

        {/* The colour check said "not a corn leaf" (NOT_A_CORN_LEAF): same spot, above the
            image. The buttons below stay, since the photo was kept and can be cropped / retried. */}
        {notCornLeaf && errorMessage && (
          <View className="mt-5 flex-row items-center rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <AlertBadge />
            <Text className="ml-3 flex-1 text-sm text-red-700">{errorMessage}</Text>
          </View>
        )}

        {/* ---------- The image ---------- */}
        <View
          className={`${notCorn || notCornLeaf ? 'mt-5' : 'mt-6'} overflow-hidden rounded-2xl bg-white`}
        >
          <Image
            // Once uploaded, show the SERVER copy. If this renders,
            // the file genuinely arrived and is readable. Saved offline,
            // the server copy cannot be loaded, so show the local photo. Same for
            // "not corn": the server deletes that photo, so its copy may be gone.
            source={{
              uri:
                uploadResult && !savedOffline && !offlineScan && !notCorn
                  ? withAuthToken(uploadResult.imageUrl, token)
                  : imageUri,
            }}
            className="aspect-square w-full"
            // A cropped photo is shown whole, so the farmer sees exactly the part they kept.
            resizeMode={croppedUri ? 'contain' : 'cover'}
          />
        </View>

        {/* ---------- Error ---------- */}
        {/* Red for every error. The two "not a corn leaf" ones are shown above the image instead. */}
        {errorMessage && !notCorn && !notCornLeaf && (
          <View className="mt-5 flex-row items-center rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <AlertBadge />
            <Text className="ml-3 flex-1 text-sm text-red-700">{errorMessage}</Text>
          </View>
        )}

        {/* ---------- Upload details ---------- */}
        {uploadResult && !notCornLeaf && !notCorn && !savedOffline && !offlineScan && (
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
        {notCorn ? (
          // Not a corn leaf: nothing was saved, so the only way on is a different photo.
          <View className="mt-7">
            <ActionButton
              onPress={() => router.replace('/camera')}
              label={t.preview.retakePhoto}
            />

            <ActionButton
              onPress={handleChooseAnother}
              disabled={isOpeningGallery}
              label={t.preview.chooseAnother}
              className="mt-3"
            />
          </View>
        ) : savedOffline ? (
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

/**
 * White button with a green outline. Pressing it fills it green and turns the
 * text white (there is no hover on a phone, so the press is the effect).
 */
function ActionButton({
  label,
  onPress,
  disabled,
  loading,
  className = '',
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}) {
  // Own press state instead of the `active:` variant. A quick tap on some of
  // these buttons leaves the screen straight away (e.g. Retake Photo), so the
  // green is held ~150 ms after the finger lifts to make sure it is seen.
  const [isPressed, setIsPressed] = useState(false);
  const releaseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (releaseTimer.current) clearTimeout(releaseTimer.current);
    };
  }, []);

  function handlePressIn() {
    if (releaseTimer.current) clearTimeout(releaseTimer.current);
    setIsPressed(true);
  }

  function handlePressOut() {
    releaseTimer.current = setTimeout(() => setIsPressed(false), 150);
  }

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      className={`flex-row items-center justify-center rounded-xl border-2 border-leaf-600 py-4 ${
        isPressed ? 'bg-leaf-600' : 'bg-white'
      } ${disabled ? 'opacity-60' : ''} ${className}`}
    >
      {loading && <ActivityIndicator size="small" color="#2a752c" className="mr-2" />}
      <Text
        className={`text-base font-semibold ${isPressed ? 'text-white' : 'text-leaf-700'}`}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/** Round red badge with a warning icon, at the left of the red error / disclaimer boxes. */
function AlertBadge() {
  return (
    <View className="h-9 w-9 items-center justify-center rounded-full bg-red-100">
      <Ionicons name="alert-circle" size={22} color="#B91C1C" />
    </View>
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
