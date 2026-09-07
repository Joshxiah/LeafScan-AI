/**
 * Reset Password screen - step 2 of 2.
 *
 * Route: /reset-password?phoneNumber=...  (reached from /forgot-password)
 *
 * The farmer enters the 6-digit code from the text message plus a
 * new password. On success we send them back to Sign In.
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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { AuthTextField } from '../../src/components/AuthTextField';
import { requestPasswordReset, resetPassword } from '../../src/services/auth.service';
import { getErrorMessage } from '../../src/services/api';
import { useLanguage } from '../../src/context/LanguageContext';
import { brand, shadows } from '../../src/constants/theme';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const { phoneNumber = '' } = useLocalSearchParams<{ phoneNumber?: string }>();

  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resendNote, setResendNote] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleResetPassword() {
    setErrorMessage(null);

    const cleanCode = code.trim();

    if (!/^\d{6}$/.test(cleanCode)) {
      setErrorMessage(t.resetPassword.errorInvalidCode);
      return;
    }

    if (password.length < 8) {
      setErrorMessage(t.resetPassword.errorPasswordLength);
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage(t.resetPassword.errorPasswordMismatch);
      return;
    }

    setIsSubmitting(true);
    try {
      await resetPassword({ phoneNumber, code: cleanCode, password });
      setDone(true);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, t.resetPassword.errorGeneric, t.apiErrors));
      console.log('[reset-password] failed', error);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResend() {
    setResendNote(null);
    setErrorMessage(null);
    try {
      await requestPasswordReset({ phoneNumber });
      setResendNote(t.resetPassword.resendSuccess);
    } catch {
      setResendNote(t.resetPassword.resendFailure);
    }
  }

  // ---------- Success state ----------
  if (done) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
        <StatusBar style="dark" />
        <View className="flex-1 items-center justify-center px-8">
          <View className="h-16 w-16 items-center justify-center rounded-2xl bg-[#2F6D46]" style={shadows.card}>
            <Ionicons name="checkmark" size={32} color="#ffffff" />
          </View>
          <Text className="mt-4 text-2xl font-extrabold text-[#16241B]">
            {t.resetPassword.successTitle}
          </Text>
          <Text className="mt-1.5 text-center text-[13px] leading-5 text-[#6C8073]">
            {t.resetPassword.successSubtitle}
          </Text>
          <Pressable
            onPress={() => router.replace('/login')}
            className="mt-7 h-14 w-full flex-row items-center justify-center rounded-full bg-[#2F6D46] active:bg-[#1F4E31]"
            style={shadows.raised}
          >
            <Text className="text-base font-bold text-white">
              {t.resetPassword.backToSignIn}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
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
              <Ionicons name="key" size={26} color="#ffffff" />
            </View>

            <Text className="mt-3.5 text-2xl font-extrabold text-[#16241B]">
              {t.resetPassword.title}
            </Text>
            <Text className="mt-1.5 text-center text-[13px] leading-5 text-[#6C8073]">
              {phoneNumber
                ? t.resetPassword.subtitleWithPhone(phoneNumber)
                : t.resetPassword.subtitleGeneric}
            </Text>
          </View>

          {/* ---------- Fields ---------- */}
          <View className="gap-4">
            <AuthTextField
              icon="keypad-outline"
              placeholder={t.resetPassword.codePlaceholder}
              value={code}
              onChangeText={(text) => setCode(text.replace(/\D/g, '').slice(0, 6))}
              keyboardType="number-pad"
              maxLength={6}
              returnKeyType="next"
            />

            <AuthTextField
              icon="lock-closed-outline"
              placeholder={t.resetPassword.newPasswordPlaceholder}
              value={password}
              onChangeText={setPassword}
              isPassword
              autoCapitalize="none"
            />

            <AuthTextField
              icon="lock-closed-outline"
              placeholder={t.resetPassword.confirmPasswordPlaceholder}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              isPassword
              autoCapitalize="none"
              returnKeyType="go"
              onSubmitEditing={handleResetPassword}
            />
          </View>

          {errorMessage && (
            <Text className="ml-1 mt-2 text-[13px] text-[#D64545]">
              {errorMessage}
            </Text>
          )}
          {resendNote && (
            <Text className="ml-1 mt-2 text-[13px] text-[#2F6D46]">
              {resendNote}
            </Text>
          )}

          {/* ---------- Action ---------- */}
          <Pressable
            onPress={handleResetPassword}
            disabled={isSubmitting}
            className="mt-6 h-14 flex-row items-center justify-center rounded-full bg-[#2F6D46] active:bg-[#1F4E31] disabled:opacity-70"
            style={shadows.raised}
          >
            {isSubmitting && (
              <ActivityIndicator size="small" color="#ffffff" className="mr-2" />
            )}
            <Text className="text-base font-bold text-white">
              {isSubmitting ? t.resetPassword.updating : t.resetPassword.updatePassword}
            </Text>
          </Pressable>

          {/* ---------- Footer ---------- */}
          <View className="mt-7 flex-row items-center justify-center">
            <Text className="text-[13px] text-[#6C8073]">
              {t.resetPassword.didNotGetCode}
            </Text>
            <Pressable onPress={handleResend} hitSlop={8}>
              <Text className="text-[13px] font-bold text-[#2F6D46]">
                {t.resetPassword.resend}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
