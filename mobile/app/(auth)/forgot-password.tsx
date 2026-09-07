/**
 * Forgot Password screen - step 1 of 2.
 *
 * Route: /forgot-password  (reached from the Sign In screen)
 *
 * The farmer types the mobile number on their account; the backend
 * texts a 6-digit code and we move on to /reset-password. For
 * privacy the backend answers the same way whether or not the
 * number is known, so this screen always advances on a well-formed
 * number.
 */

import { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { AuthTextField } from '../../src/components/AuthTextField';
import { requestPasswordReset } from '../../src/services/auth.service';
import { getErrorMessage } from '../../src/services/api';
import { useLanguage } from '../../src/context/LanguageContext';
import { brand, shadows } from '../../src/constants/theme';

const PHONE_RULE = /^(09\d{9}|\+639\d{9})$/;

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { t } = useLanguage();

  const [phoneNumber, setPhoneNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSendCode() {
    setErrorMessage(null);

    const cleanPhone = phoneNumber.trim();

    if (!PHONE_RULE.test(cleanPhone)) {
      setErrorMessage(t.forgotPassword.errorInvalidPhone);
      return;
    }

    setIsSubmitting(true);
    try {
      await requestPasswordReset({ phoneNumber: cleanPhone });

      // Same outcome whether or not the number is registered.
      router.push({
        pathname: '/reset-password',
        params: { phoneNumber: cleanPhone },
      });
    } catch (error) {
      setErrorMessage(getErrorMessage(error, t.forgotPassword.errorGeneric, t.apiErrors));
      console.log('[forgot-password] failed', error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerClassName="grow px-6 pb-8 pt-4"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {router.canGoBack() && (
            <Pressable
              onPress={() => router.back()}
              hitSlop={10}
              className="-ml-2 h-10 w-10 items-center justify-center"
            >
              <Ionicons name="arrow-back" size={24} color={brand.ink} />
            </Pressable>
          )}

          {/* ---------- Brand mark ---------- */}
          <View className="mb-7 mt-2 items-center">
            <View className="h-16 w-16 items-center justify-center rounded-2xl bg-[#2F6D46]" style={shadows.card}>
              <Ionicons name="lock-closed" size={28} color="#ffffff" />
            </View>

            <Text className="mt-3.5 text-2xl font-extrabold text-[#16241B]">
              {t.forgotPassword.title}
            </Text>
            <Text className="mt-1.5 text-center text-[13px] leading-5 text-[#6C8073]">
              {t.forgotPassword.subtitle}
            </Text>
          </View>

          {/* ---------- Field ---------- */}
          <AuthTextField
            icon="call-outline"
            placeholder={t.forgotPassword.phonePlaceholder}
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
            textContentType="telephoneNumber"
            returnKeyType="go"
            onSubmitEditing={handleSendCode}
          />

          {errorMessage && (
            <Text className="ml-1 mt-2 text-[13px] text-[#D64545]">
              {errorMessage}
            </Text>
          )}

          {/* ---------- Action ---------- */}
          <Pressable
            onPress={handleSendCode}
            disabled={isSubmitting}
            className="mt-6 h-14 flex-row items-center justify-center rounded-full bg-[#2F6D46] active:bg-[#1F4E31] disabled:opacity-70"
            style={shadows.raised}
          >
            {isSubmitting && (
              <ActivityIndicator size="small" color="#ffffff" className="mr-2" />
            )}
            <Text className="text-base font-bold text-white">
              {isSubmitting ? t.forgotPassword.sending : t.forgotPassword.sendCode}
            </Text>
          </Pressable>

          {/* ---------- Footer ---------- */}
          <View className="mt-7 flex-row items-center justify-center">
            <Text className="text-[13px] text-[#6C8073]">
              {t.forgotPassword.rememberedIt}
            </Text>
            <Pressable onPress={() => router.replace('/login')} hitSlop={8}>
              <Text className="text-[13px] font-bold text-[#2F6D46]">
                {t.forgotPassword.backToSignIn}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
