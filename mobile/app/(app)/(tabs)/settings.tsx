/**
 * Settings tab.
 *
 * Route: /settings
 *
 * Shows the signed-in farmer's profile, the language switch, a
 * shortcut to the CAO report, and sign-out (with a confirm
 * dialog). Profile data comes from AuthContext / GET /api/auth/me.
 *
 * The language names themselves ("English" / "Cebuano") are always
 * shown in their own language, never translated - the same
 * convention every language picker uses, so a farmer who picked
 * the wrong one by accident can still find their way back.
 */

import { useState } from 'react';
import { View, Text, Pressable, ScrollView, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../../../src/context/AuthContext';
import { useLanguage } from '../../../src/context/LanguageContext';
import { Language } from '../../../src/i18n/translations';
import { brand } from '../../../src/constants/theme';

const LANGUAGE_OPTIONS: { code: Language; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'ceb', label: 'Cebuano' },
];

export default function SettingsScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  const [confirmVisible, setConfirmVisible] = useState(false);

  const initial = (user?.fullName?.charAt(0) ?? '?').toUpperCase();

  async function handleLogout() {
    setConfirmVisible(false);
    await logout();
    router.replace('/login');
  }

  return (
    <SafeAreaView className="flex-1 bg-[#F5FAF6]" edges={['top']}>
      <View className="px-6 pb-2 pt-4">
        <Text className="text-center text-[17px] font-bold text-[#16241B]">
          {t.settings.title}
        </Text>
      </View>

      <ScrollView
        contentContainerClassName="px-6 pb-10 pt-3"
        showsVerticalScrollIndicator={false}
      >
        {/* ---------- Profile card ---------- */}
        <View className="flex-row items-center rounded-2xl border border-[#DFEDE3] bg-white p-4">
          <View className="h-14 w-14 items-center justify-center rounded-full bg-[#E7F4EA]">
            <Text className="text-lg font-extrabold text-[#2F6D46]">
              {initial}
            </Text>
          </View>

          <View className="ml-3 flex-1">
            <Text
              className="text-[15px] font-extrabold text-[#16241B]"
              numberOfLines={1}
            >
              {user?.fullName ?? 'Farmer'}
            </Text>
            <Pressable
              onPress={() => router.push('/report')}
              className="mt-1.5 flex-row items-center self-start rounded-full bg-[#E7F4EA] px-3 py-1 active:opacity-80"
            >
              <Ionicons name="paper-plane-outline" size={12} color={brand.accent} />
              <Text className="ml-1 text-[12px] font-semibold text-[#2F6D46]">
                {t.settings.submitReport}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* ---------- Profile information ---------- */}
        <SectionLabel text={t.settings.profileInfo} />
        <View className="rounded-2xl border border-[#DFEDE3] bg-white px-4">
          <InfoRow
            label={t.settings.phone}
            value={user?.phoneNumber ?? t.settings.notSet}
          />
          <InfoRow
            label={t.settings.barangay}
            value={user?.farmerProfile?.address ?? t.settings.notSet}
          />
          <InfoRow label={t.settings.mainCrop} value={t.settings.mainCropValue} isLast />
        </View>

        {/* ---------- Language ---------- */}
        <SectionLabel text={t.settings.language} />
        <View className="rounded-2xl border border-[#DFEDE3] bg-white px-4 py-1.5">
          <View className="flex-row items-center py-2.5">
            <Ionicons name="globe-outline" size={16} color={brand.muted} />
            <Text className="ml-2 text-[13px] text-[#6C8073]">
              {t.settings.languageHint}
            </Text>
          </View>

          {LANGUAGE_OPTIONS.map((option, i) => {
            const selected = language === option.code;
            return (
              <Pressable
                key={option.code}
                onPress={() => setLanguage(option.code)}
                className={`flex-row items-center justify-between py-3 ${
                  i < LANGUAGE_OPTIONS.length - 1 ? 'border-b border-[#EEF5EF]' : ''
                }`}
              >
                <Text
                  className={`text-[14px] ${
                    selected ? 'font-semibold text-[#16241B]' : 'text-[#6C8073]'
                  }`}
                >
                  {option.label}
                </Text>
                {selected && (
                  <Ionicons name="checkmark" size={18} color={brand.accent} />
                )}
              </Pressable>
            );
          })}
        </View>

        {/* ---------- Log out ---------- */}
        <Pressable
          onPress={() => setConfirmVisible(true)}
          className="mt-7 h-14 flex-row items-center justify-center rounded-full border border-[#F0C9C9] bg-white active:bg-[#FBEDED]"
        >
          <Ionicons name="log-out-outline" size={18} color="#D64545" />
          <Text className="ml-2 text-[15px] font-bold text-[#D64545]">
            {t.settings.logOut}
          </Text>
        </Pressable>

        <Text className="mt-5 text-center text-[11px] text-[#9BAAA1]">
          {t.settings.footer}
        </Text>
      </ScrollView>

      {/* ---------- Log out confirmation ---------- */}
      <Modal
        visible={confirmVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmVisible(false)}
      >
        <View className="flex-1 items-center justify-center bg-black/40 px-8">
          <View className="w-full rounded-2xl bg-white p-6">
            <Pressable
              onPress={() => setConfirmVisible(false)}
              hitSlop={10}
              className="absolute right-4 top-4"
            >
              <Ionicons name="close" size={20} color={brand.faint} />
            </Pressable>

            <Text className="mt-2 text-center text-lg font-extrabold text-[#16241B]">
              {t.settings.logOutTitle}
            </Text>
            <Text className="mt-2 text-center text-[13px] leading-5 text-[#6C8073]">
              {t.settings.logOutMessage}
            </Text>

            <View className="mt-5 flex-row gap-3">
              <Pressable
                onPress={() => setConfirmVisible(false)}
                className="h-11 flex-1 items-center justify-center rounded-full border border-[#DFEDE3] bg-white active:bg-[#F5FAF6]"
              >
                <Text className="text-[14px] font-semibold text-[#6C8073]">
                  {t.common.cancel}
                </Text>
              </Pressable>
              <Pressable
                onPress={handleLogout}
                className="h-11 flex-1 items-center justify-center rounded-full bg-[#D64545] active:opacity-90"
              >
                <Text className="text-[14px] font-bold text-white">
                  {t.settings.yesLogOut}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function SectionLabel({ text }: { text: string }) {
  return (
    <Text className="mb-2 mt-6 text-[11px] font-bold tracking-wide text-[#9BAAA1]">
      {text}
    </Text>
  );
}

function InfoRow({
  label,
  value,
  isLast,
}: {
  label: string;
  value: string;
  isLast?: boolean;
}) {
  return (
    <View
      className={`flex-row items-center justify-between py-3.5 ${
        isLast ? '' : 'border-b border-[#EEF5EF]'
      }`}
    >
      <Text className="text-[13px] text-[#9BAAA1]">{label}</Text>
      <Text
        className="ml-4 flex-1 text-right text-[13px] font-medium text-[#16241B]"
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
}
