/**
 * Submit Report to CAO.
 *
 * Route: /report
 *
 * Summarises the farmer's recent scans (src/data/mockScans.ts -
 * same source as Home and History, so the numbers here can never
 * disagree with what those screens show) and lets the farmer add
 * the two things only they know: how much of the field is affected,
 * and any remarks.
 *
 * There is no POST /api/reports yet, so Submit moves straight to
 * the confirmation screen. Wiring a real submission is a later
 * phase - see backend/src/controllers/upload.controller.ts for how
 * the rest of this app marks that kind of "not built yet" boundary.
 */

import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../../src/context/AuthContext';
import { useLanguage } from '../../src/context/LanguageContext';
import { brand } from '../../src/constants/theme';
import { StatCard } from '../../src/components/StatCard';
import { RECENT_SCANS, summariseScans } from '../../src/data/mockScans';

export default function ReportScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useLanguage();

  const [estimatedArea, setEstimatedArea] = useState('');
  const [remarks, setRemarks] = useState('');

  const summary = summariseScans(RECENT_SCANS);

  const profile = user?.farmerProfile;
  const locationLine = profile?.address
    ? `${profile.address}, ${profile.municipality ?? 'Pagadian City'}`
    : (profile?.municipality ?? 'Pagadian City');

  function handleSubmit() {
    router.replace('/report-success');
  }

  return (
    <SafeAreaView className="flex-1 bg-[#F5FAF6]" edges={['bottom']}>
      <StatusBar style="light" />

      {/* ---------- Green header ---------- */}
      <View className="bg-[#2F6D46] px-5 pb-5 pt-14">
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          className="flex-row items-center self-start active:opacity-80"
        >
          <Ionicons name="arrow-back" size={20} color="#ffffff" />
          <Text className="ml-1 text-[15px] font-semibold text-white">{t.common.back}</Text>
        </Pressable>

        <View className="mt-4 flex-row items-center">
          <Ionicons name="location" size={16} color="#ffffff" />
          <Text className="ml-1.5 text-[17px] font-extrabold text-white">
            {locationLine}
          </Text>
        </View>
        <Text className="ml-[22px] mt-0.5 text-[12px] text-white/70">
          {t.report.province}
        </Text>
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerClassName="px-6 pb-8 pt-5"
          showsVerticalScrollIndicator={false}
        >
          {/* ---------- Stat row ---------- */}
          <View className="flex-row gap-2.5">
            <StatCard icon="scan-outline" label={t.report.totalScan} value={summary.total} />
            <StatCard
              icon="warning-outline"
              iconColor="#D64545"
              label={t.report.cornAffected}
              value={summary.affected}
              valueColor="#D64545"
            />
            <StatCard
              icon="checkmark-circle-outline"
              iconColor={brand.accent}
              label={t.report.healthy}
              value={summary.healthy}
            />
          </View>

          {/* ---------- Breakdown ---------- */}
          <Text className="mb-2.5 mt-6 text-[11px] font-bold tracking-wide text-[#9BAAA1]">
            {t.report.breakdownTitle}
          </Text>
          <View className="gap-2.5">
            {summary.breakdown.map((item) => (
              <View
                key={item.classLabel}
                className="flex-row items-center justify-between rounded-2xl border border-[#DFEDE3] bg-white px-4 py-3.5"
              >
                <View>
                  <Text className="text-[14px] font-bold text-[#16241B]">
                    {item.displayName}
                  </Text>
                  <Text className="mt-0.5 text-[12px] text-[#9BAAA1]">
                    {t.report.plantsScanned(item.count)}
                  </Text>
                </View>
                <Text className="text-[13px] font-extrabold text-[#D64545]">
                  {t.report.affected(item.count)}
                </Text>
              </View>
            ))}
          </View>

          {/* ---------- Report details ---------- */}
          <Text className="mb-2.5 mt-6 text-[11px] font-bold tracking-wide text-[#9BAAA1]">
            {t.report.detailsTitle}
          </Text>
          <View className="rounded-2xl border border-[#DFEDE3] bg-white px-4">
            <View className="flex-row items-center justify-between border-b border-[#EEF5EF] py-3.5">
              <Text className="text-[13px] text-[#9BAAA1]">{t.report.estimatedArea}</Text>
              <View className="flex-row items-center">
                <TextInput
                  value={estimatedArea}
                  onChangeText={setEstimatedArea}
                  placeholder="0.0"
                  placeholderTextColor={brand.placeholder}
                  keyboardType="decimal-pad"
                  className="text-right text-[13px] font-bold text-[#D64545]"
                  style={{ minWidth: 40, paddingVertical: 0 }}
                />
                <Text className="ml-1 text-[13px] font-bold text-[#D64545]">
                  {t.report.hectare}
                </Text>
              </View>
            </View>
            <View className="flex-row items-center justify-between py-3.5">
              <Text className="text-[13px] text-[#9BAAA1]">{t.report.barangay}</Text>
              <Text className="text-[13px] font-medium text-[#16241B]">
                {profile?.address ?? profile?.municipality ?? t.report.notSet}
              </Text>
            </View>
          </View>

          {/* ---------- Remarks ---------- */}
          <Text className="mb-2.5 mt-6 text-[11px] font-bold tracking-wide text-[#9BAAA1]">
            {t.report.remarksTitle}
          </Text>
          <TextInput
            value={remarks}
            onChangeText={setRemarks}
            placeholder={t.report.remarksPlaceholder}
            placeholderTextColor={brand.placeholder}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            className="rounded-2xl border border-[#DFEDE3] bg-white px-4 py-3.5 text-[13px] text-[#16241B]"
            style={{ minHeight: 96 }}
          />

          {/* ---------- Submit ---------- */}
          <Pressable
            onPress={handleSubmit}
            className="mt-6 h-14 flex-row items-center justify-center rounded-full bg-[#2F6D46] active:bg-[#1F4E31]"
          >
            <Ionicons name="paper-plane-outline" size={17} color="#ffffff" />
            <Text className="ml-2 text-[15px] font-bold text-white">
              {t.report.submit}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
