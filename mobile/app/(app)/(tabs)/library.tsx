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
 *
 * States are explicit: a spinner while loading, a retryable error
 * ONLY when the request actually failed, a "no content yet" state
 * when the server returned nothing, and a "no matches" state for a
 * search that filtered everything out.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import EmptyState from '../../../src/components/EmptyState';
import { SearchInput } from '../../../src/components/SearchInput';
import { listDiseases } from '../../../src/services/disease.service';
import { useLanguage } from '../../../src/context/LanguageContext';
import { Disease } from '../../../src/types';
import { brand, shadows } from '../../../src/constants/theme';

type LoadState = 'loading' | 'error' | 'ready';

/** First sentence only, so the card stays one line. */
function firstSentence(text: string | null): string | null {
  if (!text) return null;
  const match = text.match(/^[^.]+\./);
  return (match ? match[0] : text).trim();
}

export default function LibraryScreen() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const [diseases, setDiseases] = useState<Disease[]>([]);
  const [state, setState] = useState<LoadState>('loading');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [query, setQuery] = useState('');

  const load = useCallback(async (isRetry = false) => {
    if (isRetry) setState('loading');
    try {
      const result = await listDiseases(language);
      setDiseases(result.filter((d) => !d.isHealthy));
      setState('ready');
    } catch (error) {
      console.log('[library] failed to load diseases:', error);
      setState('error');
    }
  }, [language]);

  useEffect(() => {
    void load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await load();
    setIsRefreshing(false);
  }, [load]);

  const filtered = useMemo(() => {
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

      {state === 'ready' && diseases.length > 0 && (
        <View className="px-6">
          <SearchInput
            value={query}
            onChangeText={setQuery}
            placeholder={t.library.searchPlaceholder}
          />
        </View>
      )}

      {state === 'loading' ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={brand.accent} />
        </View>
      ) : state === 'error' ? (
        <EmptyState
          icon="cloud-offline-outline"
          title={t.library.loadingErrorTitle}
          message={t.library.loadingErrorMessage}
          actionLabel={t.library.retry}
          onAction={() => void load(true)}
        />
      ) : diseases.length === 0 ? (
        <EmptyState
          icon="book-outline"
          title={t.library.emptyTitle}
          message={t.library.emptyMessage}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="search-outline"
          title={t.library.noMatchesTitle}
          message={t.library.noMatchesMessage}
        />
      ) : (
        <ScrollView
          contentContainerClassName="gap-3 px-6 pb-28 pt-4"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor={brand.accent}
            />
          }
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
              className="flex-row items-center rounded-2xl border border-[#EEF5EF] bg-white p-3 active:bg-[#F5FAF6]"
              style={shadows.card}
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

              <Ionicons name="chevron-forward" size={16} color={brand.faint} />
            </Pressable>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
