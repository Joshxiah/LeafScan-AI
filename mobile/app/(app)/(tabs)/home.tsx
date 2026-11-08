/**
 * Home screen - the farmer's scan dashboard.
 *
 * Route: /home
 *
 * Everything here is derived from the farmer's real, on-device
 * scan log (src/services/scanLog.ts) - refreshed every time this
 * screen gains focus, so it is always current right after a scan.
 * A farmer who has not scanned yet sees an honest "get started"
 * state instead of a dashboard full of numbers that never happened.
 */

import { useCallback, useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator, Image } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../../../src/context/AuthContext';
import { useLanguage } from '../../../src/context/LanguageContext';
import { useNotifications } from '../../../src/context/NotificationsContext';
import { brand, shadows } from '../../../src/constants/theme';
import { mediaUrl } from '../../../src/utils/media';
import { PartnerFooter } from '../../../src/components/PartnerFooter';
import { StatCard } from '../../../src/components/StatCard';
import { WeeklyBarChart } from '../../../src/components/WeeklyBarChart';
import { DonutChart } from '../../../src/components/DonutChart';
import { ScanListItem } from '../../../src/components/ScanListItem';
import { PendingScansNotice } from '../../../src/components/PendingScansNotice';
import { FilterPills } from '../../../src/components/FilterPills';
import { goToDiagnosis } from '../../../src/navigation/diagnosis';
import { ScanEntry } from '../../../src/services/scanLog';
import { onPendingSynced, getWaitingScans, WaitingPhoto } from '../../../src/services/pendingScans';
import { loadFarmerScans } from '../../../src/services/detection.service';
import {
  ActivityRange,
  bucketOf,
  buildActivity,
  changeVsPreviousPeriod,
  isHealthy,
  timeLabelFor,
  summariseActivity,
} from '../../../src/data/scanStats';

const RANGES: ActivityRange[] = ['Weekly', 'Monthly'];
const RECENT_COUNT = 4;

export default function HomeScreen() {
  const router = useRouter();
  const { user, token } = useAuth();
  const { t } = useLanguage();
  const [range, setRange] = useState<ActivityRange>('Weekly');
  const [scans, setScans] = useState<ScanEntry[] | null>(null);
  // Photos saved offline that have not been scanned yet. They count as
  // scans the farmer took, but have no verdict to show.
  const [waiting, setWaiting] = useState<WaitingPhoto[]>([]);
  const waitingCount = waiting.length;

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

  const firstName = user?.fullName?.split(' ')[0] ?? 'Farmer';
  const avatarUri = mediaUrl(user?.avatarPath, token);

  const rangeLabels: Record<ActivityRange, string> = {
    Weekly: t.home.weekly,
    Monthly: t.home.monthly,
  };

  const bucketLabels = {
    Today: t.common.bucketToday,
    Yesterday: t.common.bucketYesterday,
    'Last Week': t.common.bucketLastWeek,
  } as const;

  const activity = useMemo(
    () => (scans ? buildActivity(scans, range, waiting) : []),
    [scans, range, waiting]
  );
  const summary = useMemo(() => summariseActivity(activity), [activity]);
  const changePercent = useMemo(
    () => (scans ? changeVsPreviousPeriod(scans, range, waiting) : null),
    [scans, range, waiting]
  );

  // Verdict-less photos sit among the diagnosed scans by time, so a scan taken
  // offline shows up in Recent Scans right away, in the order it was taken.
  const recentItems = useMemo(
    () =>
      scans
        ? [
            ...scans.map((scan) => ({ kind: 'scan' as const, at: scan.scannedAt, scan })),
            ...waiting.map((photo) => ({ kind: 'waiting' as const, at: photo.scannedAt, photo })),
          ]
            .sort((a, b) => b.at.getTime() - a.at.getTime())
            .slice(0, RECENT_COUNT)
        : [],
    [scans, waiting]
  );

  // ---------- Still loading the log ----------
  if (!scans) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-[#F5FAF6]">
        <ActivityIndicator color={brand.accent} />
      </SafeAreaView>
    );
  }

  // ---------- Nothing scanned yet ----------
  // A photo taken offline is a scan too, so it gets the dashboard.
  if (scans.length === 0 && waitingCount === 0) {
    return (
      <SafeAreaView className="flex-1 bg-[#F5FAF6]" edges={[]}>
        <ScrollView
          contentContainerClassName="grow px-6 pb-6 pt-5"
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-row items-start justify-between">
            <View>
              <Text className="text-[13px] text-[#9BAAA1]">{t.home.goodDay}</Text>
              <Text className="mt-0.5 text-2xl font-extrabold text-[#16241B]">
                {firstName}
              </Text>
            </View>
            <HeaderActions
              avatarUri={avatarUri}
              onProfile={() => router.push('/settings')}
              onBell={() => router.push('/notifications')}
            />
          </View>

          <PendingScansNotice count={waitingCount} />

          <View className="flex-1 items-center justify-center py-10">
            <View
              className="h-24 w-24 items-center justify-center rounded-3xl bg-[#E7F4EA]"
              style={shadows.card}
            >
              <Ionicons name="scan-outline" size={44} color={brand.accent} />
            </View>

            <Text className="mt-6 text-xl font-extrabold text-[#16241B]">
              {t.home.emptyTitle}
            </Text>
            <Text className="mt-2 max-w-[280px] text-center text-[13px] leading-5 text-[#6C8073]">
              {t.home.emptyMessage}
            </Text>

            <Pressable
              onPress={() => router.push('/scan')}
              className="mt-7 h-14 flex-row items-center justify-center rounded-full bg-[#2F6D46] px-8 active:bg-[#1F4E31]"
              style={shadows.raised}
            >
              <Ionicons name="camera-outline" size={18} color="#ffffff" />
              <Text className="ml-2 text-[15px] font-bold text-white">
                {t.home.emptyAction}
              </Text>
            </Pressable>
          </View>

          {/* ---------- Diseases we can identify, so the empty state still teaches something ---------- */}
          <Pressable
            onPress={() => router.push('/library')}
            className="flex-row items-center rounded-2xl border border-[#EEF5EF] bg-white p-4 active:bg-[#F5FAF6]"
            style={shadows.card}
          >
            <View className="h-11 w-11 items-center justify-center rounded-xl bg-[#E7F4EA]">
              <Ionicons name="book-outline" size={20} color={brand.accent} />
            </View>
            <View className="ml-3.5 flex-1">
              <Text className="text-[14px] font-bold text-[#16241B]">
                {t.tabs.library}
              </Text>
              <Text className="mt-0.5 text-[12px] text-[#9BAAA1]">
                {t.home.libraryTeaser}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={brand.faint} />
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ---------- Dashboard ----------
  return (
    <SafeAreaView className="flex-1 bg-[#F5FAF6]" edges={[]}>
      <ScrollView
        contentContainerClassName="px-6 pb-6 pt-5"
        showsVerticalScrollIndicator={false}
      >
        {/* ---------- Greeting ---------- */}
        <View className="flex-row items-start justify-between">
          <View>
            <Text className="text-[13px] text-[#9BAAA1]">{t.home.goodDay}</Text>
            <Text className="mt-0.5 text-2xl font-extrabold text-[#16241B]">
              {firstName}
            </Text>
          </View>

          <HeaderActions
            avatarUri={avatarUri}
            onProfile={() => router.push('/settings')}
            onBell={() => router.push('/notifications')}
          />
        </View>

        <PendingScansNotice count={waitingCount} />

        {/* ---------- Range toggle ---------- */}
        <View className="mt-5">
          <FilterPills
            options={RANGES}
            value={range}
            onChange={setRange}
            getLabel={(option) => rangeLabels[option]}
          />
        </View>

        {/* ---------- Scan Activity ---------- */}
        <View className="mt-4 rounded-2xl border border-[#EEF5EF] bg-white p-5" style={shadows.card}>
          <View className="flex-row items-center justify-between">
            <Text className="text-[11px] font-bold tracking-wide text-[#9BAAA1]">
              {t.home.scanActivity}
            </Text>
            {changePercent !== null && (
              <View className="flex-row items-center">
                <Ionicons
                  name={changePercent >= 0 ? 'trending-up' : 'trending-down'}
                  size={13}
                  color={changePercent >= 0 ? brand.accent : '#D64545'}
                />
                <Text
                  className="ml-1 text-[12px] font-bold"
                  style={{ color: changePercent >= 0 ? brand.accent : '#D64545' }}
                >
                  {changePercent >= 0 ? '+' : ''}
                  {changePercent}%
                </Text>
              </View>
            )}
          </View>

          <View className="mt-1.5 flex-row items-baseline">
            <Text className="text-3xl font-extrabold text-[#16241B]">
              {summary.total}
            </Text>
            <Text className="ml-2 text-[13px] text-[#6C8073]">{t.home.totalScans}</Text>
          </View>
          {summary.waiting > 0 && (
            <View className="mt-1 flex-row items-center">
              <Ionicons name="cloud-upload-outline" size={13} color="#92400E" />
              <Text className="ml-1 text-[12px] font-semibold text-amber-800">
                {t.home.includesWaiting(summary.waiting)}
              </Text>
            </View>
          )}

          <View className="mt-4">
            <WeeklyBarChart data={activity} />
          </View>
        </View>

        {/* ---------- Healthy / Diseased ---------- */}
        <View className="mt-4 flex-row gap-3">
          <StatCard
            icon="checkmark-circle-outline"
            iconColor={brand.accent}
            label={t.home.healthy}
            value={summary.healthy}
          />
          <StatCard
            icon="warning-outline"
            iconColor="#D64545"
            label={t.home.diseased}
            value={summary.diseased}
            valueColor="#D64545"
          />
        </View>

        {/* ---------- Disease Distribution ---------- */}
        <View className="mt-4 rounded-2xl border border-[#EEF5EF] bg-white p-5" style={shadows.card}>
          <Text className="text-[11px] font-bold tracking-wide text-[#9BAAA1]">
            {t.home.diseaseDistribution}
          </Text>

          {summary.healthy + summary.diseased === 0 ? (
            <Text className="mt-3 text-[13px] leading-5 text-[#6C8073]">
              {summary.waiting > 0 ? t.home.resultsAfterScan : t.home.noActivityInRange}
            </Text>
          ) : (
            <View className="mt-3 flex-row items-center">
              <DonutChart
                segments={[
                  { value: summary.healthy, color: brand.accent },
                  { value: summary.diseased, color: '#D64545' },
                ]}
              />

              <View className="ml-6 flex-1 gap-2.5">
                <LegendRow
                  color={brand.accent}
                  label={t.home.healthy}
                  count={summary.healthy}
                  percent={summary.healthyPercent}
                />
                <LegendRow
                  color="#D64545"
                  label={t.home.diseased}
                  count={summary.diseased}
                  percent={summary.diseasedPercent}
                />
              </View>
            </View>
          )}
        </View>

        {/* ---------- Recent Scans ---------- */}
        <View className="mt-6">
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-[15px] font-bold text-[#16241B]">{t.home.recentScans}</Text>
            <Pressable onPress={() => router.push('/history')} hitSlop={8}>
              <Text className="text-[13px] font-bold text-[#2F6D46]">
                {t.home.viewHistory}
              </Text>
            </Pressable>
          </View>

          <View className="gap-2.5">
            {recentItems.map((item) =>
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

        {/* ---------- Tip ---------- */}
        <View className="mt-6 flex-row items-center rounded-2xl bg-[#E7F4EA] p-4">
          <View className="h-8 w-8 items-center justify-center rounded-full bg-[#2F6D46]">
            <Ionicons name="leaf" size={15} color="#ffffff" />
          </View>
          <Text className="ml-3 flex-1 text-[12.5px] leading-5 text-[#1F4E31]">
            {t.home.tip}
          </Text>
        </View>

        <PartnerFooter />
      </ScrollView>
    </SafeAreaView>
  );
}

function HeaderActions({
  avatarUri,
  onProfile,
  onBell,
}: {
  avatarUri: string | null;
  onProfile: () => void;
  onBell: () => void;
}) {
  const { unreadCount } = useNotifications();
  return (
    <View className="flex-row items-center gap-2">
      <Pressable
        onPress={onBell}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Open notifications"
        className="h-10 w-10 items-center justify-center rounded-full bg-white active:bg-[#EEF5EF]"
        style={shadows.card}
      >
        <Ionicons name="notifications-outline" size={18} color={brand.accent} />
        {unreadCount > 0 && (
          <View className="absolute -right-0.5 -top-0.5 h-4 min-w-4 items-center justify-center rounded-full bg-[#D64545] px-1">
            <Text className="text-[9px] font-extrabold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </Text>
          </View>
        )}
      </Pressable>

      <ProfileButton avatarUri={avatarUri} onPress={onProfile} />
    </View>
  );
}

function ProfileButton({
  avatarUri,
  onPress,
}: {
  avatarUri: string | null;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel="Open settings"
      className="h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-white active:bg-[#EEF5EF]"
      style={shadows.card}
    >
      {avatarUri ? (
        <Image source={{ uri: avatarUri }} className="h-10 w-10" resizeMode="cover" />
      ) : (
        <Ionicons name="person-outline" size={18} color={brand.accent} />
      )}
    </Pressable>
  );
}

function LegendRow({
  color,
  label,
  count,
  percent,
}: {
  color: string;
  label: string;
  count: number;
  percent: number;
}) {
  return (
    <View className="flex-row items-center justify-between">
      <View className="flex-row items-center">
        <View className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
        <Text className="ml-2 text-[13px] text-[#16241B]">{label}</Text>
      </View>
      <Text className="text-[13px] font-bold text-[#16241B]">
        {count}
        <Text className="font-semibold text-[#9BAAA1]">  ·  {percent}%</Text>
      </Text>
    </View>
  );
}
