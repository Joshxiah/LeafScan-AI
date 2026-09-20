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
 * Layout: a horizontally-scrolling row of tall cards, one per
 * disease, centered in the available space. Each card is two stacked
 * sections, NOT an overlay: a large photo on top (contain, so the
 * whole image is always visible, never cropped - letterboxes onto a
 * soft mist background if its aspect ratio does not fill the box),
 * then a plain info section below it (divider, name, scientific
 * name, symptoms, "View details"). The photo is roughly 55-60% of
 * the card's height. Tapping the photo opens a full-size preview
 * lightbox; tapping "View details" specifically (a separate, nested
 * touch target) navigates to the full detail screen instead.
 *
 * The bundled reference photos in assets/images/diseases/ are real,
 * CC-licensed corn-leaf photos (see the header comment in
 * src/constants/diseaseImages.ts for sources) - drop a different
 * photo under the same filename to swap one, no code change needed.
 *
 * States are explicit: a spinner while loading, a retryable error
 * ONLY when the request actually failed, a "no content yet" state
 * when the server returned nothing, and a "no matches" state for a
 * search that filtered everything out.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Modal,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import EmptyState from '../../../src/components/EmptyState';
import { SearchInput } from '../../../src/components/SearchInput';
import { listDiseases } from '../../../src/services/disease.service';
import { useLanguage } from '../../../src/context/LanguageContext';
import { Disease } from '../../../src/types';
import { brand, shadows } from '../../../src/constants/theme';
import { diseaseImage } from '../../../src/constants/diseaseImages';

type LoadState = 'loading' | 'error' | 'ready';

/** First couple of sentences, so the preview stays short. */
function symptomPreview(text: string | null): string | null {
  if (!text) return null;
  const match = text.match(/^(?:[^.]+\.){1,2}/);
  return (match ? match[0] : text).trim();
}

export default function LibraryScreen() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const [diseases, setDiseases] = useState<Disease[]>([]);
  const [state, setState] = useState<LoadState>('loading');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [query, setQuery] = useState('');
  const [previewDisease, setPreviewDisease] = useState<Disease | null>(null);

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
        <View className="flex-1">
          <ScrollView
            horizontal
            contentContainerClassName="flex-grow items-center justify-center gap-4 px-6 py-4"
            showsHorizontalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={onRefresh}
                tintColor={brand.accent}
              />
            }
          >
            {filtered.map((disease) => (
              <DiseaseCard
                key={disease.id}
                disease={disease}
                preview={symptomPreview(disease.symptoms)}
                viewDetailsLabel={t.library.viewDetails}
                symptomsLabel={t.diseaseDetail.symptoms}
                onPreview={() => setPreviewDisease(disease)}
                onViewDetails={() =>
                  router.push({
                    pathname: '/disease-detail',
                    params: { data: JSON.stringify(disease) },
                  })
                }
              />
            ))}
          </ScrollView>
        </View>
      )}

      <ImagePreviewModal disease={previewDisease} onClose={() => setPreviewDisease(null)} />
    </SafeAreaView>
  );
}

function DiseaseCard({
  disease,
  preview,
  viewDetailsLabel,
  symptomsLabel,
  onPreview,
  onViewDetails,
}: {
  disease: Disease;
  preview: string | null;
  viewDetailsLabel: string;
  symptomsLabel: string;
  onPreview: () => void;
  onViewDetails: () => void;
}) {
  return (
    <View style={shadows.card} className="w-72 overflow-hidden rounded-3xl border border-[#EEF5EF] bg-white">
      {/* The photo is its own tap target for the preview lightbox - shown whole (contain), never cropped or overlaid. */}
      <Pressable onPress={onPreview} className="h-64 w-full items-center justify-center bg-[#E7F4EA] active:opacity-95">
        <Image
          source={diseaseImage(disease.classLabel)}
          className="h-full w-full"
          resizeMode="contain"
        />
      </Pressable>

      <View className="bg-white px-4 pb-4 pt-2">
        <View className="mb-3 h-px bg-[#D9E5DC]" />

        <Text className="text-[16px] font-bold text-[#16241B]" numberOfLines={1}>
          {disease.displayName}
        </Text>

        {disease.scientificName ? (
          <Text className="mt-0.5 text-[11px] italic text-[#9BAAA1]" numberOfLines={1}>
            {disease.scientificName}
          </Text>
        ) : null}

        {preview ? (
          <>
            <View className="mb-3 mt-3 h-px bg-[#D9E5DC]" />

            <Text className="text-[10px] font-bold tracking-wide text-[#9BAAA1]">
              {symptomsLabel}
            </Text>
            <Text className="mt-1 text-[12.5px] leading-5 text-[#6C8073]" numberOfLines={3}>
              {preview}
            </Text>
          </>
        ) : null}

        <View className="mb-3 mt-3 h-px bg-[#D9E5DC]" />

        {/* Separate, nested tap target - navigates, while the photo above only opens the lightbox. */}
        <Pressable onPress={onViewDetails} hitSlop={8} className="flex-row items-center active:opacity-70">
          <Text className="flex-1 text-[12px] font-bold text-[#2F6D46]">{viewDetailsLabel}</Text>
          <Ionicons name="chevron-forward" size={16} color={brand.accent} />
        </Pressable>
      </View>
    </View>
  );
}

/** Full-size lightbox for a disease photo. Closes on the backdrop or the X - never on the image itself. */
function ImagePreviewModal({
  disease,
  onClose,
}: {
  disease: Disease | null;
  onClose: () => void;
}) {
  const { width, height } = useWindowDimensions();

  return (
    <Modal visible={!!disease} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable onPress={onClose} className="flex-1 items-center justify-center bg-black/90 px-6">
        {disease && (
          <Pressable onPress={() => {}}>
            <Image
              source={diseaseImage(disease.classLabel)}
              style={{ width: width - 48, height: height * 0.7 }}
              resizeMode="contain"
            />
          </Pressable>
        )}

        <Pressable
          onPress={onClose}
          hitSlop={12}
          className="absolute right-5 top-14 h-10 w-10 items-center justify-center rounded-full bg-white/15"
        >
          <Ionicons name="close" size={22} color="#fff" />
        </Pressable>
      </Pressable>
    </Modal>
  );
}
