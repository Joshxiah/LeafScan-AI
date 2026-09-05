/**
 * Diagnosis - the result of one scan.
 *
 * Route: /diagnosis?classLabel=...&confidence=...&scannedAt=...
 *
 * Reached by tapping a scan on Home or in History. The verdict
 * (which disease, what confidence) is mock data - see
 * src/data/mockScans.ts - because the AI model is not wired up
 * yet (Phase 13). Everything below the confidence card, though, is
 * real: the description and "Recommended Actions" are read live
 * from GET /api/diseases, the same source the Disease Library uses.
 */

import { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { listDiseases } from '../../src/services/disease.service';
import { Disease } from '../../src/types';
import { useLanguage } from '../../src/context/LanguageContext';
import { brand } from '../../src/constants/theme';
import { CLASS_DISPLAY_NAME, ScanClassLabel } from '../../src/data/mockScans';

export default function DiagnosisScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const { classLabel, confidence } = useLocalSearchParams<{
    classLabel: ScanClassLabel;
    confidence: string;
  }>();

  const [diseases, setDiseases] = useState<Disease[] | null>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    listDiseases()
      .then((result) => {
        if (isMounted) setDiseases(result);
      })
      .catch(() => {
        if (isMounted) setLoadError(true);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const disease = useMemo(
    () => diseases?.find((d) => d.classLabel === classLabel) ?? null,
    [diseases, classLabel]
  );

  const isHealthy = classLabel === 'healthy';
  const confidenceValue = Number(confidence) || 0;
  const fallbackName = classLabel ? CLASS_DISPLAY_NAME[classLabel] : 'Unknown';

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
        {/* ---------- Verdict banner ---------- */}
        <View className="flex-row items-center">
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
          Corn (Zea mays)
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

        {/* ---------- Recommended actions ---------- */}
        <Text className="mb-2.5 mt-6 text-[13px] font-bold text-[#9BAAA1]">
          {t.diagnosis.recommendedActions}
        </Text>

        {!diseases && !loadError ? (
          <ActivityIndicator className="mt-4" color={brand.accent} />
        ) : isHealthy ? (
          <ActionCard text={t.diagnosis.noTreatmentNeeded} />
        ) : disease && disease.treatments.length > 0 ? (
          <View className="gap-2.5">
            {disease.treatments.map((treatment) => (
              <ActionCard key={treatment.id} text={treatment.recommendationText} />
            ))}
          </View>
        ) : (
          <ActionCard text={t.diagnosis.noTreatmentPublished} />
        )}

        {/* ---------- View full disease entry ---------- */}
        {disease && (
          <Pressable
            onPress={() =>
              router.push({
                pathname: '/disease-detail',
                params: { data: JSON.stringify(disease) },
              })
            }
            className="mt-6 h-14 flex-row items-center justify-center rounded-full border border-[#DFEDE3] bg-white active:bg-[#F5FAF6]"
          >
            <Text className="text-[15px] font-bold text-[#16241B]">
              {t.diagnosis.viewTreatmentPlan}
            </Text>
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function ActionCard({ text }: { text: string }) {
  return (
    <View
      className="rounded-xl bg-white px-4 py-3.5"
      style={{ borderLeftWidth: 3, borderLeftColor: brand.accent }}
    >
      <Text className="text-[13px] leading-5 text-[#16241B]">{text}</Text>
    </View>
  );
}
