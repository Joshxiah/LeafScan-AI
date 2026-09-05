/**
 * Home screen - the farmer's scan dashboard.
 *
 * Route: /home
 *
 * Scan Activity, the Healthy/Diseased split, Disease Distribution
 * and Recent Scans all read from src/data/mockScans.ts. That file
 * is the ONE place these numbers come from, so a stat card and the
 * chart beside it can never disagree - see its header comment for
 * why this is mock data rather than a live endpoint.
 */

import { useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../../../src/context/AuthContext';
import { useLanguage } from '../../../src/context/LanguageContext';
import { brand } from '../../../src/constants/theme';
import { StatCard } from '../../../src/components/StatCard';
import { WeeklyBarChart } from '../../../src/components/WeeklyBarChart';
import { DonutChart } from '../../../src/components/DonutChart';
import { ScanListItem } from '../../../src/components/ScanListItem';
import { FilterPills } from '../../../src/components/FilterPills';
import { goToDiagnosis } from '../../../src/navigation/diagnosis';
import {
  ACTIVITY_BY_RANGE,
  ACTIVITY_CHANGE_PERCENT,
  ActivityRange,
  CLASS_DISPLAY_NAME,
  RECENT_SCANS,
  bucketOf,
  isHealthy,
  timeLabelFor,
  summariseActivity,
} from '../../../src/data/mockScans';

const RANGES: ActivityRange[] = ['Weekly', 'Monthly'];
const RECENT_COUNT = 4;

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [range, setRange] = useState<ActivityRange>('Weekly');

  const rangeLabels: Record<ActivityRange, string> = {
    Weekly: t.home.weekly,
    Monthly: t.home.monthly,
  };

  const bucketLabels = {
    Today: t.common.bucketToday,
    Yesterday: t.common.bucketYesterday,
    'Last Week': t.common.bucketLastWeek,
  } as const;

  const firstName = user?.fullName?.split(' ')[0] ?? 'Farmer';

  const activity = ACTIVITY_BY_RANGE[range];
  const summary = useMemo(() => summariseActivity(activity), [activity]);

  const recentScans = useMemo(
    () =>
      [...RECENT_SCANS]
        .sort((a, b) => b.scannedAt.getTime() - a.scannedAt.getTime())
        .slice(0, RECENT_COUNT),
    []
  );

  return (
    <SafeAreaView className="flex-1 bg-[#F5FAF6]" edges={['top']}>
      <ScrollView
        contentContainerClassName="px-6 pb-10 pt-5"
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

          <Pressable
            onPress={() => router.push('/settings')}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Open settings"
            className="h-10 w-10 items-center justify-center rounded-full bg-white active:bg-[#EEF5EF]"
          >
            <Ionicons name="person-outline" size={18} color={brand.accent} />
          </Pressable>
        </View>

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
        <View className="mt-4 rounded-2xl border border-[#DFEDE3] bg-white p-5">
          <View className="flex-row items-center justify-between">
            <Text className="text-[11px] font-bold tracking-wide text-[#9BAAA1]">
              {t.home.scanActivity}
            </Text>
            <View className="flex-row items-center">
              <Ionicons name="trending-up" size={13} color={brand.accent} />
              <Text className="ml-1 text-[12px] font-bold text-[#2F6D46]">
                +{ACTIVITY_CHANGE_PERCENT[range]}%
              </Text>
            </View>
          </View>

          <View className="mt-1.5 flex-row items-baseline">
            <Text className="text-3xl font-extrabold text-[#16241B]">
              {summary.total}
            </Text>
            <Text className="ml-2 text-[13px] text-[#6C8073]">{t.home.totalScans}</Text>
          </View>

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
        <View className="mt-4 rounded-2xl border border-[#DFEDE3] bg-white p-5">
          <Text className="text-[11px] font-bold tracking-wide text-[#9BAAA1]">
            {t.home.diseaseDistribution}
          </Text>

          <View className="mt-3 flex-row items-center">
            <DonutChart
              segments={[
                { value: summary.healthy, color: brand.accent },
                { value: summary.diseased, color: '#D64545' },
              ]}
            />

            <View className="ml-6 flex-1 gap-2.5">
              <LegendRow color={brand.accent} label={t.home.healthy} percent={summary.healthyPercent} />
              <LegendRow color="#D64545" label={t.home.diseased} percent={summary.diseasedPercent} />
            </View>
          </View>
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
            {recentScans.map((scan) => (
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

        {/* ---------- Tip ---------- */}
        <View className="mt-6 flex-row items-center rounded-2xl bg-[#E7F4EA] p-4">
          <View className="h-8 w-8 items-center justify-center rounded-full bg-[#2F6D46]">
            <Ionicons name="leaf" size={15} color="#ffffff" />
          </View>
          <Text className="ml-3 flex-1 text-[12.5px] leading-5 text-[#1F4E31]">
            {t.home.tip}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function LegendRow({
  color,
  label,
  percent,
}: {
  color: string;
  label: string;
  percent: number;
}) {
  return (
    <View className="flex-row items-center justify-between">
      <View className="flex-row items-center">
        <View className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
        <Text className="ml-2 text-[13px] text-[#16241B]">{label}</Text>
      </View>
      <Text className="text-[13px] font-bold text-[#16241B]">{percent}%</Text>
    </View>
  );
}
