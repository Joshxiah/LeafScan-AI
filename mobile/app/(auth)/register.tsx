/**
 * Create Account Screen.
 *
 * Route: /register
 *
 *   Full Name        (required)
 *   Email            (required - the login identifier)
 *   Password         (required)
 *   Confirm Password (required)
 *   Phone Number     (optional)
 *   Address          (optional)
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
import { RegisterPayload } from '../../src/types';

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleRegister() {
    setErrorMessage(null);

    if (fullName.trim().length < 2) {
      setErrorMessage('Please enter your full name.');
      return;
    }

    if (!email.trim().includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('The two passwords do not match.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: RegisterPayload = {
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
      };

      if (phoneNumber.trim()) payload.phoneNumber = phoneNumber.trim();
      if (address.trim()) payload.address = address.trim();

      await register(payload);

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
          contentContainerClassName="px-6 py-8"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text className="text-2xl font-bold text-leaf-800">
            Create Account
          </Text>
          <Text className="mt-1 text-sm text-gray-500">
            Register as a corn farmer to start scanning
          </Text>

          {errorMessage && (
            <View className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <Text className="text-sm text-red-700">{errorMessage}</Text>
            </View>
          )}

          {/* Full Name */}
          <Text className="mb-1.5 mt-6 text-sm font-medium text-gray-700">
            Full Name <Text className="text-red-500">*</Text>
          </Text>
          <TextInput
            value={fullName}
            onChangeText={setFullName}
            placeholder="Juan Dela Cruz"
            placeholderTextColor="#9ca3af"
            autoCapitalize="words"
            editable={!isSubmitting}
            className="rounded-xl border border-gray-300 bg-white px-4 py-3.5 text-base text-gray-900"
          />

          {/* Email */}
          <Text className="mb-1.5 mt-5 text-sm font-medium text-gray-700">
            Email <Text className="text-red-500">*</Text>
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
          <Text className="mt-1 text-xs text-gray-400">
            You will use this to log in.
          </Text>

          {/* Password */}
          <Text className="mb-1.5 mt-5 text-sm font-medium text-gray-700">
            Password <Text className="text-red-500">*</Text>
          </Text>
          <View className="flex-row items-center rounded-xl border border-gray-300 bg-white pr-3">
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="At least 8 characters"
              placeholderTextColor="#9ca3af"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              editable={!isSubmitting}
              className="flex-1 px-4 py-3.5 text-base text-gray-900"
            />
            <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={8}>
              <Text className="text-sm font-medium text-leaf-700">
                {showPassword ? 'Hide' : 'Show'}
              </Text>
            </Pressable>
          </View>

          {/* Confirm Password */}
          <Text className="mb-1.5 mt-5 text-sm font-medium text-gray-700">
            Confirm Password <Text className="text-red-500">*</Text>
          </Text>
          <TextInput
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Type your password again"
            placeholderTextColor="#9ca3af"
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            editable={!isSubmitting}
            className="rounded-xl border border-gray-300 bg-white px-4 py-3.5 text-base text-gray-900"
          />

          {/* Phone Number */}
          <Text className="mb-1.5 mt-5 text-sm font-medium text-gray-700">
            Phone Number
          </Text>
          <TextInput
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            placeholder="09171234567"
            placeholderTextColor="#9ca3af"
            keyboardType="phone-pad"
            editable={!isSubmitting}
            className="rounded-xl border border-gray-300 bg-white px-4 py-3.5 text-base text-gray-900"
          />

          {/* Address */}
          <Text className="mb-1.5 mt-5 text-sm font-medium text-gray-700">
            Address
          </Text>
          <TextInput
            value={address}
            onChangeText={setAddress}
            placeholder="Barangay Balangasan, Pagadian City"
            placeholderTextColor="#9ca3af"
            autoCapitalize="words"
            multiline
            editable={!isSubmitting}
            className="rounded-xl border border-gray-300 bg-white px-4 py-3.5 text-base text-gray-900"
            style={{ textAlignVertical: 'top', minHeight: 70 }}
          />

          {/* Submit */}
          <Pressable
            onPress={handleRegister}
            disabled={isSubmitting}
            className={`mt-9 flex-row items-center justify-center rounded-xl py-4 ${
              isSubmitting ? 'bg-leaf-400' : 'bg-leaf-600 active:bg-leaf-700'
            }`}
          >
            {isSubmitting && (
              <ActivityIndicator size="small" color="#ffffff" className="mr-2" />
            )}
            <Text className="text-base font-semibold text-white">
              {isSubmitting ? 'Creating account...' : 'Create Account'}
            </Text>
          </Pressable>

          <View className="mt-6 flex-row justify-center">
            <Text className="text-sm text-gray-500">
              Already have an account?{' '}
            </Text>
            <Link href="/login" asChild>
              <Pressable>
                <Text className="text-sm font-semibold text-leaf-700">
                  Log in
                </Text>
              </Pressable>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}