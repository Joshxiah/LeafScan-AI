/**
 * Login Screen.
 *
 * Route: /login
 *
 * Calls POST /api/auth/login through AuthContext. On success the
 * token is stored and the routing guard sends the user to Home.
 */

import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '../../src/context/AuthContext';
import { ApiError } from '../../src/services/api';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleLogin() {
    setErrorMessage(null);

    // Check the obvious problems before spending a network call.
    if (!email.trim()) {
      setErrorMessage('Please enter your email address.');
      return;
    }

    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsSubmitting(true);

    try {
      await login({
        email: email.trim().toLowerCase(),
        password,
      });

      // The routing guard handles navigation once user is set.
      router.replace('/home');
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('Something went wrong. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerClassName="flex-grow px-6 py-8"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ---------- Header ---------- */}
          <View className="items-center">
            <View className="h-20 w-20 items-center justify-center rounded-2xl bg-leaf-600">
              <Text className="text-3xl">🌽</Text>
            </View>

            <Text className="mt-5 text-2xl font-bold text-leaf-800">
              Welcome Back
            </Text>

            <Text className="mt-1 text-sm text-gray-500">
              Log in to continue scanning corn leaves
            </Text>
          </View>

          {/* ---------- Error banner ---------- */}
          {errorMessage && (
            <View className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <Text className="text-sm text-red-700">{errorMessage}</Text>
            </View>
          )}

          {/* ---------- Form ---------- */}
          <View className="mt-8">
            <Text className="mb-1.5 text-sm font-medium text-gray-700">
              Email
            </Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="juan@example.com"
              placeholderTextColor="#9ca3af"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isSubmitting}
              className="rounded-xl border border-gray-300 bg-white px-4 py-3.5 text-base text-gray-900"
            />

            <Text className="mb-1.5 mt-5 text-sm font-medium text-gray-700">
              Password
            </Text>
            <View className="flex-row items-center rounded-xl border border-gray-300 bg-white pr-3">
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                placeholderTextColor="#9ca3af"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isSubmitting}
                className="flex-1 px-4 py-3.5 text-base text-gray-900"
              />
              <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={8}>
                <Text className="text-sm font-medium text-leaf-700">
                  {showPassword ? 'Hide' : 'Show'}
                </Text>
              </Pressable>
            </View>
          </View>

          {/* ---------- Submit ---------- */}
          <Pressable
            onPress={handleLogin}
            disabled={isSubmitting}
            className={`mt-8 flex-row items-center justify-center rounded-xl py-4 ${
              isSubmitting ? 'bg-leaf-400' : 'bg-leaf-600 active:bg-leaf-700'
            }`}
          >
            {isSubmitting && (
              <ActivityIndicator size="small" color="#ffffff" className="mr-2" />
            )}
            <Text className="text-base font-semibold text-white">
              {isSubmitting ? 'Logging in...' : 'Log In'}
            </Text>
          </Pressable>

          <View className="flex-1" />

          {/* ---------- Link to register ---------- */}
          <View className="mt-8 flex-row justify-center">
            <Text className="text-sm text-gray-500">
              Don&apos;t have an account?{' '}
            </Text>
            <Link href="/register" asChild>
              <Pressable>
                <Text className="text-sm font-semibold text-leaf-700">
                  Create one
                </Text>
              </Pressable>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}