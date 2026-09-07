/**
 * Sign In screen.
 *
 * Route: /login  (the first screen after the splash)
 *
 * Design follows the approved LeafScan AI login-flow: a centred
 * brand mark, two pill inputs on a light-green fill, and a single
 * full-width action.
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

import { useAuth } from '../../src/context/AuthContext';
import { useLanguage } from '../../src/context/LanguageContext';
import { AuthTextField } from '../../src/components/AuthTextField';
import { brand, shadows } from '../../src/constants/theme';
import { getErrorMessage } from '../../src/services/api';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const { t } = useLanguage();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSignIn() {
    setErrorMessage(null);

    if (!username.trim()) {
      setErrorMessage(t.login.errorEmptyUsername);
      return;
    }

    if (!password) {
      setErrorMessage(t.login.errorEmptyPassword);
      return;
    }

    setIsSubmitting(true);
    try {
      await login({ username: username.trim(), password });
      router.replace('/home');
    } catch (error) {
      setErrorMessage(getErrorMessage(error, t.login.errorGeneric, t.apiErrors));
      console.log('[login] failed', error);
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
        {router.canGoBack() && (
          <Pressable
            onPress={() => router.back()}
            hitSlop={10}
            className="ml-4 mt-1 h-10 w-10 items-center justify-center"
          >
            <Ionicons name="arrow-back" size={24} color={brand.ink} />
          </Pressable>
        )}

        <ScrollView
          contentContainerClassName="grow justify-center px-6 pb-10 pt-6"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ---------- Brand mark ---------- */}
          <View className="mb-7 items-center">
            <View className="h-16 w-16 items-center justify-center rounded-2xl bg-[#2F6D46]" style={shadows.card}>
              <Ionicons name="leaf" size={30} color="#ffffff" />
            </View>

            <Text className="mt-3.5 text-2xl font-extrabold text-[#16241B]">
              {t.login.welcomeBack}
            </Text>
            <Text className="mt-1.5 text-center text-[13px] text-[#6C8073]">
              {t.login.subtitle}
            </Text>
          </View>

          {/* ---------- Fields ---------- */}
          <View className="gap-4">
            <AuthTextField
              icon="person-outline"
              placeholder={t.login.usernamePlaceholder}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="username"
              returnKeyType="next"
            />

            <AuthTextField
              icon="lock-closed-outline"
              placeholder={t.login.passwordPlaceholder}
              value={password}
              onChangeText={setPassword}
              isPassword
              autoCapitalize="none"
              textContentType="password"
              returnKeyType="go"
              onSubmitEditing={handleSignIn}
            />
          </View>

          {/* ---------- Forgot password ---------- */}
          <Pressable
            onPress={() => router.push('/forgot-password')}
            hitSlop={8}
            className="mt-3 self-end"
          >
            <Text className="text-[13px] font-bold text-[#2F6D46]">
              {t.login.forgotPassword}
            </Text>
          </Pressable>

          {errorMessage && (
            <Text className="ml-1 mt-2 text-[13px] text-[#D64545]">
              {errorMessage}
            </Text>
          )}

          {/* ---------- Action ---------- */}
          <Pressable
            onPress={handleSignIn}
            disabled={isSubmitting}
            className="mt-6 h-14 flex-row items-center justify-center rounded-full bg-[#2F6D46] active:bg-[#1F4E31] disabled:opacity-70"
            style={shadows.raised}
          >
            {isSubmitting && (
              <ActivityIndicator size="small" color="#ffffff" className="mr-2" />
            )}
            <Text className="text-base font-bold text-white">
              {isSubmitting ? t.login.signingIn : t.login.signIn}
            </Text>
          </Pressable>

          {/* ---------- Footer ---------- */}
          <View className="mt-7 items-center">
            <Text className="text-center text-[13px] leading-5 text-[#6C8073]">
              {t.login.noAccount}
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
