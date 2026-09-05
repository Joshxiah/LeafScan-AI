/**
 * Scan History tab.
 *
 * Route: /history
 *
 * Lists every mock scan (see src/data/mockScans.ts), searchable by
 * disease name and filterable to just the diseased or healthy
 * ones, grouped under Today / Yesterday / Last Week the same way
 * Home's "Recent Scans" does.
 */

import { useMemo, useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import EmptyState from '../../../src/components/EmptyState';
import { SearchInput } from '../../../src/components/SearchInput';
import { FilterPills } from '../../../src/components/FilterPills';
import { ScanListItem } from '../../../src/components/ScanListItem';
import { goToDiagnosis } from '../../../src/navigation/diagnosis';
import { useLanguage } from '../../../src/context/LanguageContext';
import {
  CLASS_DISPLAY_NAME,
  RECENT_SCANS,
  SCAN_BUCKETS,
  ScanBucket,
  bucketOf,
  isHealthy,
  timeLabelFor,
  MockScan,
} from '../../../src/data/mockScans';

const FILTERS = ['All', 'Diseased', 'Healthy'] as const;
type Filter = (typeof FILTERS)[number];

export default function HistoryScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('All');

  const filterLabels: Record<Filter, string> = {
    All: t.history.filterAll,
    Diseased: t.history.filterDiseased,
    Healthy: t.history.filterHealthy,
  };

  const bucketLabels: Record<ScanBucket, string> = {
    Today: t.common.bucketToday,
    Yesterday: t.common.bucketYesterday,
    'Last Week': t.common.bucketLastWeek,
  };

  const grouped = useMemo(() => {
    const cleanQuery = query.trim().toLowerCase();

    const filtered = RECENT_SCANS.filter((scan) => {
      if (filter === 'Diseased' && isHealthy(scan)) return false;
      if (filter === 'Healthy' && !isHealthy(scan)) return false;

      if (!cleanQuery) return true;
      return CLASS_DISPLAY_NAME[scan.classLabel].toLowerCase().includes(cleanQuery);
    }).sort((a, b) => b.scannedAt.getTime() - a.scannedAt.getTime());

    return SCAN_BUCKETS.map((bucket) => ({
      bucket,
      scans: filtered.filter((scan) => bucketOf(scan) === bucket),
    })).filter((group) => group.scans.length > 0);
  }, [query, filter]);

  const hasAnyResults = grouped.length > 0;

  return (
    <SafeAreaView className="flex-1 bg-[#F5FAF6]" edges={['top']}>
      <View className="px-6 pb-3 pt-4">
        <Text className="text-center text-[17px] font-bold text-[#16241B]">
          {t.history.title}
        </Text>
      </View>

      <View className="gap-3 px-6">
        <SearchInput
          value={query}
          onChangeText={setQuery}
          placeholder={t.history.searchPlaceholder}
        />
        <FilterPills
          options={FILTERS}
          value={filter}
          onChange={setFilter}
          getLabel={(option) => filterLabels[option]}
        />
      </View>

      {hasAnyResults ? (
        <ScrollView
          contentContainerClassName="px-6 pb-10 pt-5"
          showsVerticalScrollIndicator={false}
        >
          {grouped.map(({ bucket, scans }) => (
            <View key={bucket} className="mb-5">
              <Text className="mb-2.5 text-[13px] font-bold text-[#9BAAA1]">
                {bucketLabels[bucket]}
              </Text>
              <View className="gap-2.5">
                {scans.map((scan: MockScan) => (
                  <ScanListItem
                    key={scan.id}
                    title={CLASS_DISPLAY_NAME[scan.classLabel]}
                    subtitle={`${t.common.corn} | ${timeLabelFor(scan) ?? bucketLabels[bucketOf(scan)]}`}
                    confidence={scan.confidence}
                    healthy={isHealthy(scan)}
                    onPress={() => goToDiagnosis(router, scan)}
                  />
                ))}
              </View>
            </View>
          ))}
        </ScrollView>
      ) : (
        <EmptyState
          icon="time-outline"
          title={t.history.noMatchesTitle}
          message={t.history.noMatchesMessage}
        />
      )}
    </SafeAreaView>
  );
}
