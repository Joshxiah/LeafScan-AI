/**
 * Create Account screen.
 *
 * Route: /register
 *
 * Design follows the approved LeafScan AI login-flow: grouped
 * sections, white pill inputs with a hairline border, one clear
 * primary action.
 *
 * The fields map onto what the backend actually needs:
 *   first + last name  -> fullName
 *   username, password, phoneNumber, address
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
import { brand } from '../../src/constants/theme';

const USERNAME_RULE = /^[a-z0-9._]+$/;
const PHONE_RULE = /^(09\d{9}|\+639\d{9})$/;

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const { t } = useLanguage();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleCreateAccount() {
    setErrorMessage(null);

    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
    const cleanUsername = username.trim().toLowerCase();
    const cleanPhone = phoneNumber.trim();

    if (fullName.length < 2) {
      setErrorMessage(t.register.errorFullName);
      return;
    }

    if (cleanUsername.length < 4 || cleanUsername.length > 50) {
      setErrorMessage(t.register.errorUsernameLength);
      return;
    }

    if (!USERNAME_RULE.test(cleanUsername)) {
      setErrorMessage(t.register.errorUsernameChars);
      return;
    }

    if (password.length < 8) {
      setErrorMessage(t.register.errorPasswordLength);
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage(t.register.errorPasswordMismatch);
      return;
    }

    if (!PHONE_RULE.test(cleanPhone)) {
      setErrorMessage(t.register.errorPhone);
      return;
    }

    setIsSubmitting(true);
    try {
      await register({
        fullName,
        username: cleanUsername,
        password,
        phoneNumber: cleanPhone,
        address: address.trim() || undefined,
      });
      router.replace('/home');
    } catch (error) {
      setErrorMessage(t.register.errorGeneric);
      console.log('[register] failed', error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-[#F5FAF6]" edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerClassName="px-6 pb-10 pt-4"
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

          {/* ---------- Heading ---------- */}
          <View className="mb-5 mt-2">
            <Text className="text-2xl font-extrabold text-[#16241B]">
              {t.register.title}
            </Text>
            <Text className="mt-1.5 text-[13px] leading-5 text-[#6C8073]">
              {t.register.subtitle}
            </Text>
          </View>

          {/* ---------- Personal information ---------- */}
          <Text className="mb-2 text-[13px] font-bold text-[#2F6D46]">
            {t.register.personalInfo}
          </Text>

          <View className="gap-4">
            <View className="flex-row gap-3">
              <View className="flex-1">
                <AuthTextField
                  variant="outline"
                  icon="person-outline"
                  placeholder={t.register.firstName}
                  value={firstName}
                  onChangeText={setFirstName}
                  autoCapitalize="words"
                />
              </View>
              <View className="flex-1">
                <AuthTextField
                  variant="outline"
                  icon="person-outline"
                  placeholder={t.register.lastName}
                  value={lastName}
                  onChangeText={setLastName}
                  autoCapitalize="words"
                />
              </View>
            </View>

            <AuthTextField
              variant="outline"
              icon="at-outline"
              placeholder={t.register.username}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <AuthTextField
              variant="outline"
              icon="lock-closed-outline"
              placeholder={t.register.passwordPlaceholder}
              value={password}
              onChangeText={setPassword}
              isPassword
              autoCapitalize="none"
            />

            <AuthTextField
              variant="outline"
              icon="lock-closed-outline"
              placeholder={t.register.confirmPasswordPlaceholder}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              isPassword
              autoCapitalize="none"
            />

            <View>
              <AuthTextField
                variant="outline"
                icon="call-outline"
                placeholder={t.register.phonePlaceholder}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
              />
              <Text className="ml-4 mt-1 text-[11px] text-[#9BAAA1]">
                {t.register.phoneHint}
              </Text>
            </View>
          </View>

          {/* ---------- Farm location ---------- */}
          <Text className="mb-2 mt-6 text-[13px] font-bold text-[#2F6D46]">
            {t.register.farmLocation}
          </Text>

          <AuthTextField
            variant="outline"
            icon="location-outline"
            placeholder={t.register.addressPlaceholder}
            value={address}
            onChangeText={setAddress}
            autoCapitalize="words"
          />

          {errorMessage && (
            <Text className="ml-1 mt-3 text-[13px] text-[#D64545]">
              {errorMessage}
            </Text>
          )}

          {/* ---------- Action ---------- */}
          <Pressable
            onPress={handleCreateAccount}
            disabled={isSubmitting}
            className="mt-6 h-14 flex-row items-center justify-center rounded-full bg-[#2F6D46] active:bg-[#1F4E31] disabled:opacity-70"
          >
            {isSubmitting && (
              <ActivityIndicator size="small" color="#ffffff" className="mr-2" />
            )}
            <Text className="text-base font-bold text-white">
              {isSubmitting ? t.register.creatingAccount : t.register.createAccount}
            </Text>
          </Pressable>

          {/* ---------- Footer ---------- */}
          <View className="mt-5 flex-row items-center justify-center">
            <Text className="text-[13px] text-[#6C8073]">
              {t.register.alreadyHaveAccount}
            </Text>
            <Pressable onPress={() => router.replace('/login')} hitSlop={8}>
              <Text className="text-[13px] font-bold text-[#2F6D46]">
                {t.register.logIn}
              </Text>
            </Pressable>
          </View>

          <Text className="mt-4 text-center text-[11px] text-[#9BAAA1]">
            {t.register.privacyNote}
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
