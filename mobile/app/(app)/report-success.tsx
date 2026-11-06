/**
 * Report submitted confirmation.
 *
 * Route: /report-success
 *
 * Shown after the CAO report is sent. There is nothing to go
 * back to here - the only way out is Home.
 */

import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useLanguage } from '../../src/context/LanguageContext';
import { shadows } from '../../src/constants/theme';
import { PartnerFooter } from '../../src/components/PartnerFooter';

export default function ReportSuccessScreen() {
  const router = useRouter();
  const { t } = useLanguage();

  return (
    <SafeAreaView className="flex-1 bg-[#F5FAF6]" edges={['top', 'bottom']}>
      <View className="flex-1 justify-center px-6">
        {/* ---------- Confirmation card ---------- */}
        <View
          className="items-center rounded-3xl border border-[#EEF5EF] bg-white px-6 pb-7 pt-9"
          style={shadows.card}
        >
          {/* Mist halo around the brand-green check */}
          <View className="h-28 w-28 items-center justify-center rounded-full bg-[#E7F4EA]">
            <View
              className="h-20 w-20 items-center justify-center rounded-full bg-[#2F6D46]"
              style={shadows.raised}
            >
              <Ionicons name="checkmark" size={42} color="#ffffff" />
            </View>
          </View>

          <Text className="mt-6 text-center text-2xl font-extrabold text-[#16241B]">
            {t.reportSuccess.title}
          </Text>
          <Text className="mt-2 max-w-[280px] text-center text-[13px] leading-5 text-[#6C8073]">
            {t.reportSuccess.subtitle}
          </Text>
        </View>

        {/* ---------- Primary action ---------- */}
        <Pressable
          onPress={() => router.replace('/home')}
          accessibilityRole="button"
          className="mt-6 h-14 w-full flex-row items-center justify-center rounded-full bg-[#2F6D46] active:bg-[#1F4E31]"
          style={shadows.raised}
        >
          <Ionicons name="home-outline" size={18} color="#ffffff" />
          <Text className="ml-2 text-[15px] font-bold text-white">
            {t.reportSuccess.backToHome}
          </Text>
        </Pressable>

        <PartnerFooter />
      </View>
    </SafeAreaView>
  );
}
