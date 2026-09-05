/**
 * Scan History tab.
 *
 * Route: /history
 *
 * Lists the farmer's real, on-device scan log (refreshed every
 * time this tab gains focus), searchable by disease name and
 * filterable to just the diseased or healthy ones, grouped under
 * Today / Yesterday / Last Week.
 */

import { useCallback, useMemo, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import EmptyState from '../../../src/components/EmptyState';
import { SearchInput } from '../../../src/components/SearchInput';
import { FilterPills } from '../../../src/components/FilterPills';
import { ScanListItem } from '../../../src/components/ScanListItem';
import { goToDiagnosis } from '../../../src/navigation/diagnosis';
import { useLanguage } from '../../../src/context/LanguageContext';
import { brand } from '../../../src/constants/theme';
import { getScanLog, ScanEntry } from '../../../src/services/scanLog';
import {
  CLASS_DISPLAY_NAME,
  SCAN_BUCKETS,
  ScanBucket,
  bucketOf,
  isHealthy,
  timeLabelFor,
} from '../../../src/data/scanStats';

const FILTERS = ['All', 'Diseased', 'Healthy'] as const;
type Filter = (typeof FILTERS)[number];

export default function HistoryScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('All');
  const [scans, setScans] = useState<ScanEntry[] | null>(null);

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      getScanLog().then((log) => {
        if (isMounted) setScans(log);
      });
      return () => {
        isMounted = false;
      };
    }, [])
  );

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
    if (!scans) return [];
    const cleanQuery = query.trim().toLowerCase();

    const filtered = scans
      .filter((scan) => {
        if (filter === 'Diseased' && isHealthy(scan)) return false;
        if (filter === 'Healthy' && !isHealthy(scan)) return false;

        if (!cleanQuery) return true;
        return CLASS_DISPLAY_NAME[scan.classLabel].toLowerCase().includes(cleanQuery);
      })
      .sort((a, b) => b.scannedAt.getTime() - a.scannedAt.getTime());

    return SCAN_BUCKETS.map((bucket) => ({
      bucket,
      scans: filtered.filter((scan) => bucketOf(scan) === bucket),
    })).filter((group) => group.scans.length > 0);
  }, [scans, query, filter]);

  const hasAnyResults = grouped.length > 0;

  return (
    <SafeAreaView className="flex-1 bg-[#F5FAF6]" edges={['top']}>
      <View className="px-6 pb-3 pt-4">
        <Text className="text-center text-[17px] font-bold text-[#16241B]">
          {t.history.title}
        </Text>
      </View>

      {!scans ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={brand.accent} />
        </View>
      ) : scans.length === 0 ? (
        <EmptyState
          icon="time-outline"
          title={t.home.emptyTitle}
          message={t.home.emptyMessage}
          actionLabel={t.home.emptyAction}
          onAction={() => router.push('/scan')}
        />
      ) : (
        <>
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
              {grouped.map(({ bucket, scans: bucketScans }) => (
                <View key={bucket} className="mb-5">
                  <Text className="mb-2.5 text-[13px] font-bold text-[#9BAAA1]">
                    {bucketLabels[bucket]}
                  </Text>
                  <View className="gap-2.5">
                    {bucketScans.map((scan) => (
                      <ScanListItem
                        key={scan.id}
                        title={CLASS_DISPLAY_NAME[scan.classLabel]}
                        subtitle={`${t.common.corn} | ${timeLabelFor(scan) ?? bucketLabels[bucketOf(scan)]}`}
                        confidence={scan.confidence}
                        healthy={isHealthy(scan)}
                        healthyLabel={t.home.healthy}
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
        </>
      )}
    </SafeAreaView>
  );
}
