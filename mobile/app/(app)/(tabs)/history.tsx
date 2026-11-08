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
import { useAuth } from '../../../src/context/AuthContext';
import { useLanguage } from '../../../src/context/LanguageContext';
import { brand } from '../../../src/constants/theme';
import { mediaUrl } from '../../../src/utils/media';
import { ScanEntry } from '../../../src/services/scanLog';
import { onPendingSynced, getWaitingScans, WaitingPhoto } from '../../../src/services/pendingScans';
import { loadFarmerScans } from '../../../src/services/detection.service';
import {
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
  const { user, token } = useAuth();
  const { t } = useLanguage();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('All');
  const [scans, setScans] = useState<ScanEntry[] | null>(null);
  // Photos taken offline that have no diagnosis yet - listed so the farmer
  // can see the scan was kept, but never as healthy or diseased.
  const [waiting, setWaiting] = useState<WaitingPhoto[]>([]);

  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      let isMounted = true;
      const reload = () => {
        loadFarmerScans(user.id).then((log) => {
          if (isMounted) setScans(log);
        });
        getWaitingScans(user.id).then((photos) => {
          if (isMounted) setWaiting(photos);
        });
      };
      reload();
      const unsubscribe = onPendingSynced(reload);
      return () => {
        isMounted = false;
        unsubscribe();
      };
    }, [user])
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
        return t.diseaseNames[scan.classLabel].toLowerCase().includes(cleanQuery);
      })
      .sort((a, b) => b.scannedAt.getTime() - a.scannedAt.getTime());

    // A waiting photo has no disease name and is neither healthy nor diseased,
    // so only the unfiltered, unsearched list shows it.
    const shownWaiting = filter === 'All' && !cleanQuery ? waiting : [];

    const items = [
      ...filtered.map((scan) => ({ kind: 'scan' as const, at: scan.scannedAt, scan })),
      ...shownWaiting.map((photo) => ({ kind: 'waiting' as const, at: photo.scannedAt, photo })),
    ].sort((a, b) => b.at.getTime() - a.at.getTime());

    return SCAN_BUCKETS.map((bucket) => ({
      bucket,
      items: items.filter((item) => bucketOf({ scannedAt: item.at }) === bucket),
    })).filter((group) => group.items.length > 0);
  }, [scans, waiting, query, filter, t]);

  const hasAnyResults = grouped.length > 0;

  return (
    <SafeAreaView className="flex-1 bg-[#F5FAF6]" edges={[]}>
      <View className="px-6 pb-3 pt-4">
        <Text className="text-center text-[17px] font-bold text-[#16241B]">
          {t.history.title}
        </Text>
      </View>

      {!scans ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={brand.accent} />
        </View>
      ) : scans.length === 0 && waiting.length === 0 ? (
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
              contentContainerClassName="px-6 pb-28 pt-5"
              showsVerticalScrollIndicator={false}
            >
              {grouped.map(({ bucket, items: bucketItems }) => (
                <View key={bucket} className="mb-5">
                  <Text className="mb-2.5 text-[13px] font-bold text-[#9BAAA1]">
                    {bucketLabels[bucket]}
                  </Text>
                  <View className="gap-2.5">
                    {bucketItems.map((item) =>
                      item.kind === 'waiting' ? (
                        <ScanListItem
                          key={item.photo.id}
                          waiting
                          title={t.common.waitingForResult}
                          subtitle={`${t.common.corn} | ${timeLabelFor(item.photo) ?? bucketLabels[bucketOf(item.photo)]} | ${t.common.waitingToUpload}`}
                          confidence={0}
                          healthy={false}
                          healthyLabel={t.home.healthy}
                          imageUri={item.photo.localUri}
                        />
                      ) : (
                        <ScanListItem
                          key={item.scan.id}
                          title={t.diseaseNames[item.scan.classLabel]}
                          subtitle={`${t.common.corn} | ${timeLabelFor(item.scan) ?? bucketLabels[bucketOf(item.scan)]}${item.scan.pending ? ` | ${t.common.waitingToUpload}` : ''}`}
                          confidence={item.scan.confidence}
                          healthy={isHealthy(item.scan)}
                          healthyLabel={t.home.healthy}
                          imageUri={item.scan.localUri ?? mediaUrl(item.scan.imagePath, token)}
                          onPress={() => goToDiagnosis(router, item.scan)}
                        />
                      )
                    )}
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
