/**
 * Disease detail.
 *
 * Route: /disease-detail?data=<json>
 *
 * Opened from the Disease Library. The full disease object is
 * passed through the route params as JSON so this screen needs
 * no second network call.
 */

import { useMemo } from 'react';
import { View, Text, Image, Pressable, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { Disease } from '../../src/types';
import { useLanguage } from '../../src/context/LanguageContext';
import { brand } from '../../src/constants/theme';
import { diseaseImage } from '../../src/constants/diseaseImages';

/** Turns one blob of prose into individual bullet points. */
function toBullets(text: string | null): string[] {
  if (!text) return [];
  return text
    .split(/\n|(?<=\.)\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function DiseaseDetailScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const { data } = useLocalSearchParams<{ data?: string }>();

  const disease = useMemo<Disease | null>(() => {
    if (!data) return null;
    try {
      return JSON.parse(data) as Disease;
    } catch {
      return null;
    }
  }, [data]);

  if (!disease) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white px-8">
        <Text className="text-center text-[14px] text-[#6C8073]">
          {t.diseaseDetail.couldNotLoad}
        </Text>
        <Pressable onPress={() => router.back()} className="mt-4">
          <Text className="text-[14px] font-bold text-[#2F6D46]">
            {t.diseaseDetail.goBack}
          </Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const symptoms = toBullets(disease.symptoms);

  return (
    <SafeAreaView className="flex-1 bg-[#F5FAF6]" edges={['top', 'bottom']}>
      <ScrollView
        contentContainerClassName="pb-10"
        showsVerticalScrollIndicator={false}
      >
        {/* ---------- Image header ---------- */}
        <View className="h-56 bg-[#E7F4EA]">
          <Image
            source={diseaseImage(disease.classLabel)}
            className="h-full w-full"
            resizeMode="cover"
          />

          <Pressable
            onPress={() => router.back()}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Close"
            className="absolute right-5 top-4 h-9 w-9 items-center justify-center rounded-full bg-white/80"
          >
            <Ionicons name="close" size={20} color={brand.ink} />
          </Pressable>
        </View>

        {/* ---------- Content ---------- */}
        <View className="-mt-6 rounded-t-3xl bg-white px-6 pt-6">
          <View className="flex-row items-center">
            <Ionicons name="leaf" size={20} color={brand.accent} />
            <Text className="ml-2 flex-1 text-xl font-extrabold text-[#16241B]">
              {disease.displayName}
            </Text>
          </View>

          {disease.scientificName ? (
            <Text className="mt-1 text-[12px] italic text-[#9BAAA1]">
              {disease.scientificName}
            </Text>
          ) : null}

          {disease.description ? (
            <Text className="mt-3 text-[13px] leading-5 text-[#6C8073]">
              {disease.description}
            </Text>
          ) : null}

          {/* ---------- Symptoms ---------- */}
          {symptoms.length > 0 && (
            <View className="mt-6">
              <Text className="text-[11px] font-bold tracking-wide text-[#9BAAA1]">
                {t.diseaseDetail.symptoms}
              </Text>
              <View className="mt-2 gap-1.5">
                {symptoms.map((line, i) => (
                  <Bullet key={i} text={line} />
                ))}
              </View>
            </View>
          )}

          {/* ---------- Treatment ---------- */}
          <View className="mt-6">
            <Text className="text-[11px] font-bold tracking-wide text-[#9BAAA1]">
              {t.diseaseDetail.treatment}
            </Text>

            {disease.treatments.length === 0 ? (
              <Text className="mt-2 text-[13px] leading-5 text-[#6C8073]">
                {t.diseaseDetail.noTreatmentYet}
              </Text>
            ) : (
              <View className="mt-2 gap-4">
                {disease.treatments.map((treatment) => (
                  <View key={treatment.id}>
                    <Text className="text-[13px] font-bold text-[#16241B]">
                      {treatment.title}
                    </Text>
                    <Text className="mt-1 text-[13px] leading-5 text-[#6C8073]">
                      {treatment.recommendationText}
                    </Text>
                    {treatment.applicationMethod ? (
                      <Text className="mt-1 text-[12px] leading-5 text-[#9BAAA1]">
                        {t.diseaseDetail.howToApply}
                        {treatment.applicationMethod}
                      </Text>
                    ) : null}
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Bullet({ text }: { text: string }) {
  return (
    <View className="flex-row">
      <Text className="text-[13px] text-[#2F6D46]">•</Text>
      <Text className="ml-2 flex-1 text-[13px] leading-5 text-[#6C8073]">
        {text}
      </Text>
    </View>
  );
}
