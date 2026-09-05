/**
 * Disease Library tab.
 *
 * Route: /library
 *
 * Real content: GET /api/diseases, including whatever treatment
 * recommendations the CAO has published (see
 * database/seed_treatment_recommendations.sql for the starter set).
 * The healthy "disease" entry is left out - there is nothing to
 * browse about a leaf with no symptoms.
 */

import { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import EmptyState from '../../../src/components/EmptyState';
import { SearchInput } from '../../../src/components/SearchInput';
import { listDiseases } from '../../../src/services/disease.service';
import { useLanguage } from '../../../src/context/LanguageContext';
import { Disease } from '../../../src/types';
import { brand } from '../../../src/constants/theme';

/** First sentence only, so the card stays one line. */
function firstSentence(text: string | null): string | null {
  if (!text) return null;
  const match = text.match(/^[^.]+\./);
  return (match ? match[0] : text).trim();
}

export default function LibraryScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const [diseases, setDiseases] = useState<Disease[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    let isMounted = true;

    listDiseases()
      .then((result) => {
        if (isMounted) setDiseases(result.filter((d) => !d.isHealthy));
      })
      .catch(() => {
        if (isMounted) setLoadFailed(true);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    if (!diseases) return [];
    const cleanQuery = query.trim().toLowerCase();
    if (!cleanQuery) return diseases;
    return diseases.filter((d) => d.displayName.toLowerCase().includes(cleanQuery));
  }, [diseases, query]);

  return (
    <SafeAreaView className="flex-1 bg-[#F5FAF6]" edges={['top']}>
      <View className="px-6 pb-3 pt-4">
        <Text className="text-center text-[17px] font-bold text-[#16241B]">
          {t.library.title}
        </Text>
      </View>

      <View className="px-6">
        <SearchInput
          value={query}
          onChangeText={setQuery}
          placeholder={t.library.searchPlaceholder}
        />
      </View>

      {!diseases && !loadFailed ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={brand.accent} />
        </View>
      ) : loadFailed ? (
        <EmptyState
          icon="cloud-offline-outline"
          title={t.library.loadingErrorTitle}
          message={t.library.loadingErrorMessage}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="book-outline"
          title={t.library.noMatchesTitle}
          message={t.library.noMatchesMessage}
        />
      ) : (
        <ScrollView
          contentContainerClassName="gap-3 px-6 pb-10 pt-4"
          showsVerticalScrollIndicator={false}
        >
          {filtered.map((disease) => (
            <Pressable
              key={disease.id}
              onPress={() =>
                router.push({
                  pathname: '/disease-detail',
                  params: { data: JSON.stringify(disease) },
                })
              }
              className="flex-row items-center rounded-2xl border border-[#DFEDE3] bg-white p-3 active:bg-[#F5FAF6]"
            >
              <View className="h-16 w-16 items-center justify-center rounded-xl bg-[#E7F4EA]">
                <Ionicons name="leaf" size={26} color={brand.accent} />
              </View>

              <View className="ml-3.5 flex-1">
                <View className="flex-row items-center">
                  <Text className="flex-1 text-[15px] font-bold text-[#16241B]" numberOfLines={1}>
                    {disease.displayName}
                  </Text>
                  <View className="ml-2 rounded-full bg-[#E7F4EA] px-2.5 py-0.5">
                    <Text className="text-[10px] font-bold text-[#2F6D46]">{t.common.corn}</Text>
                  </View>
                </View>
                {firstSentence(disease.symptoms) && (
                  <Text
                    className="mt-1 text-[12px] leading-4 text-[#6C8073]"
                    numberOfLines={1}
                  >
                    {firstSentence(disease.symptoms)}
                  </Text>
                )}
              </View>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
