/**
 * Diagnosis - the result of one scan.
 *
 * Route: /diagnosis?classLabel=...&confidence=...&scannedAt=...
 *
 * Reached by tapping a scan on Home or in History. The verdict
 * (which disease, what confidence) came from a mock classifier at
 * scan time - see pickMockDiagnosis() in src/data/scanStats.ts -
 * because the AI model is not wired up yet (Phase 13), but the
 * scan itself is real: it is read back from src/services/scanLog.ts.
 * Everything below the confidence card is also real: the
 * description and "Recommended Actions" are read live from
 * GET /api/diseases, the same source the Disease Library uses.
 */

import { useEffect, useMemo, useState } from 'react';
import { View, Text, Image, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { listDiseases } from '../../src/services/disease.service';
import { ControlLevel, Disease } from '../../src/types';
import { useLanguage } from '../../src/context/LanguageContext';
import { brand, shadows } from '../../src/constants/theme';
import { ScanClassLabel } from '../../src/data/scanStats';
import { useAuth } from '../../src/context/AuthContext';
import { mediaUrl } from '../../src/utils/media';
import { ControlLevelPill } from '../../src/components/ControlLevelPill';
import { CONTROL_LEVEL_STYLE, CONTROL_LEVEL_ORDER } from '../../src/constants/controlLevels';

export default function DiagnosisScreen() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const { token } = useAuth();
  const { classLabel, confidence, imageUri, imagePath, pending } = useLocalSearchParams<{
    classLabel: ScanClassLabel;
    confidence: string;
    imageUri?: string;
    imagePath?: string;
    pending?: string;
  }>();

  // The leaf photo that was scanned: the on-device copy when we have
  // one (instant, works offline), otherwise the server copy.
  const photoUri = imageUri || mediaUrl(imagePath, token);

  const [diseases, setDiseases] = useState<Disease[] | null>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    listDiseases(language)
      .then((result) => {
        if (isMounted) setDiseases(result);
      })
      .catch(() => {
        if (isMounted) setLoadError(true);
      });

    return () => {
      isMounted = false;
    };
  }, [language]);

  const disease = useMemo(
    () => diseases?.find((d) => d.classLabel === classLabel) ?? null,
    [diseases, classLabel]
  );

  const isHealthy = classLabel === 'healthy';
  const confidenceValue = Number(confidence) || 0;
  const fallbackName =
    classLabel && classLabel in t.diseaseNames
      ? t.diseaseNames[classLabel as ScanClassLabel]
      : 'Unknown';

  return (
    <SafeAreaView className="flex-1 bg-[#F5FAF6]" edges={['top', 'bottom']}>
      {/* ---------- Header ---------- */}
      <View className="flex-row items-center px-5 py-4">
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          className="h-9 w-9 items-center justify-center"
        >
          <Ionicons name="arrow-back" size={22} color={brand.ink} />
        </Pressable>
        <Text className="flex-1 text-center text-[16px] font-bold text-[#16241B]">
          {t.diagnosis.title}
        </Text>
        <View className="w-9" />
      </View>

      <ScrollView
        contentContainerClassName="px-6 pb-10"
        showsVerticalScrollIndicator={false}
      >
        {/* ---------- The scanned leaf ---------- */}
        {photoUri && (
          <View className="mb-4 overflow-hidden rounded-2xl bg-white" style={shadows.card}>
            <Image
              source={{ uri: photoUri }}
              className="aspect-square w-full"
              resizeMode="cover"
            />
          </View>
        )}

        {pending === '1' && (
          <View className="mb-4 flex-row items-center rounded-xl bg-[#FFF6E0] px-4 py-3">
            <Ionicons name="cloud-offline-outline" size={16} color="#9A6B00" />
            <Text className="ml-2 flex-1 text-[12.5px] text-[#7A5600]">
              {t.diagnosis.pendingUploadNote}
            </Text>
          </View>
        )}

        {/* ---------- Verdict banner ---------- */}
        <View
          className="flex-row items-center self-start rounded-full px-3 py-1.5"
          style={{ backgroundColor: isHealthy ? '#E7F4EA' : '#FBEDED' }}
        >
          <Ionicons
            name={isHealthy ? 'checkmark-circle' : 'warning'}
            size={14}
            color={isHealthy ? brand.accent : '#D64545'}
          />
          <Text
            className="ml-1.5 text-[12px] font-bold tracking-wide"
            style={{ color: isHealthy ? brand.accent : '#D64545' }}
          >
            {isHealthy ? t.diagnosis.healthyLabel : t.diagnosis.diseaseDetectedLabel}
          </Text>
        </View>

        <Text className="mt-2 text-[26px] font-extrabold leading-8 text-[#16241B]">
          {disease?.displayName ?? fallbackName}
        </Text>
        <Text className="mt-0.5 text-[13px] italic text-[#9BAAA1]">
          {t.common.corn} (Zea mays)
        </Text>

        {/* ---------- Confidence ---------- */}
        <View className="mt-5 rounded-2xl bg-[#E7F4EA] px-5 py-4">
          <Text className="text-[11px] font-bold tracking-wide text-[#5B8A6B]">
            {t.diagnosis.confidence}
          </Text>
          <Text className="mt-1 text-3xl font-extrabold text-[#1F4E31]">
            {confidenceValue}%
          </Text>
        </View>

        {/* ---------- Description ---------- */}
        {disease?.description ? (
          <Text className="mt-5 text-[13.5px] leading-5 text-[#3F5246]">
            {disease.description}
          </Text>
        ) : !diseases && !loadError ? (
          <ActivityIndicator className="mt-5" color={brand.accent} />
        ) : null}

        {isHealthy ? (
          /* ---------- Healthy leaf: NO treatment plan ---------- */
          <View
            className="mt-6 rounded-2xl border border-[#DCEFE1] bg-white px-4 py-4"
            style={shadows.card}
          >
            <View className="flex-row items-center justify-between">
              <Text className="text-[13px] text-[#9BAAA1]">
                {t.diagnosis.detectionResult}
              </Text>
              <Text className="text-[13px] font-bold text-[#16241B]">
                {disease?.displayName ?? fallbackName}
              </Text>
            </View>
            <View className="mt-2.5 flex-row items-center justify-between border-t border-[#EEF5EF] pt-2.5">
              <Text className="text-[13px] text-[#9BAAA1]">{t.diagnosis.statusLabel}</Text>
              <View className="flex-row items-center">
                <Ionicons name="checkmark-circle" size={15} color={brand.accent} />
                <Text className="ml-1.5 text-[13px] font-bold text-[#2F6D46]">
                  {t.diagnosis.noDiseaseDetected}
                </Text>
              </View>
            </View>
            <Text className="mt-3 text-[12.5px] leading-5 text-[#6C8073]">
              {t.diagnosis.healthyNote}
            </Text>
          </View>
        ) : (
          <>
            {/* ---------- View full disease entry ---------- */}
            {disease && (
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: '/disease-detail',
                    params: { data: JSON.stringify(disease) },
                  })
                }
                className="mt-6 h-14 flex-row items-center justify-center rounded-full border border-[#EEF5EF] bg-white active:bg-[#F5FAF6]"
                style={shadows.card}
              >
                <Text className="text-[15px] font-bold text-[#16241B]">
                  {t.diagnosis.viewTreatmentPlan}
                </Text>
              </Pressable>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function ActionCard({ text, level }: { text: string; level?: ControlLevel | null }) {
  const { t } = useLanguage();
  const accent = level ? CONTROL_LEVEL_STYLE[level].color : brand.accent;

  return (
    <View
      className="rounded-xl bg-white px-4 py-3.5"
      style={[{ borderLeftWidth: 4, borderLeftColor: accent }, shadows.card]}
    >
      {level ? (
        <View className="mb-2">
          <ControlLevelPill level={level} />
        </View>
      ) : null}
      <Text className="text-[13px] leading-5 text-[#16241B]">{text}</Text>
      {level === 'chemical' ? (
        <Text className="mt-2 text-[12px] font-semibold" style={{ color: accent }}>
          {t.treatmentLevels.chemicalWarning}
        </Text>
      ) : null}
    </View>
  );
}
