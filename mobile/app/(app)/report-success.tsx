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
import { brand } from '../../src/constants/theme';

export default function ReportSuccessScreen() {
  const router = useRouter();
  const { t } = useLanguage();

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <View className="flex-1 items-center justify-center px-8">
        <View className="h-20 w-20 items-center justify-center rounded-full bg-[#22A559]">
          <Ionicons name="checkmark" size={40} color="#ffffff" />
        </View>

        <Text className="mt-6 text-2xl font-extrabold text-[#16241B]">
          {t.reportSuccess.title}
        </Text>
        <Text className="mt-2 text-center text-[13px] leading-5 text-[#6C8073]">
          {t.reportSuccess.subtitle}
        </Text>

        <Pressable
          onPress={() => router.replace('/home')}
          className="mt-8 h-14 w-full flex-row items-center justify-center rounded-full border border-[#DFEDE3] bg-white active:bg-[#F5FAF6]"
        >
          <Ionicons name="home-outline" size={18} color={brand.ink} />
          <Text className="ml-2 text-[15px] font-bold text-[#16241B]">
            {t.reportSuccess.backToHome}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
