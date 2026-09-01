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
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '../../src/context/AuthContext';

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleRegister() {
    setErrorMessage(null);

    if (!fullName.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }

    if (!username.trim()) {
      setErrorMessage('Please enter a username.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    try {
      await register({
        fullName: fullName.trim(),
        username: username.trim(),
        password,
        phoneNumber: phoneNumber.trim() || undefined,
        address: address.trim() || undefined,
      });
      router.replace('/home');
    } catch (error) {
      setErrorMessage('Unable to create account right now. Please try again.');
      console.log('[register] failed', error);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerClassName="px-5 py-6"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="rounded-[28px] bg-white px-4 py-4 shadow-sm">
            {errorMessage ? (
              <View className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2">
                <Text className="text-sm text-red-700">{errorMessage}</Text>
              </View>
            ) : null}

            <TextInput
              value={fullName}
              onChangeText={setFullName}
              placeholder="Last Name"
              placeholderTextColor="#6b7280"
              autoCapitalize="words"
              className="mb-3 rounded-2xl border border-leaf-200 bg-leaf-50 px-4 py-4 text-[20px] text-gray-900"
            />

            <View className="mb-3 flex-row">
              <TextInput
                value={username}
                onChangeText={setUsername}
                placeholder="Ext. (Jr.)"
                placeholderTextColor="#6b7280"
                autoCapitalize="words"
                className="mr-3 flex-1 rounded-2xl border border-leaf-200 bg-leaf-50 px-4 py-4 text-[20px] text-gray-900"
              />
              <View className="flex-1 rounded-2xl border border-leaf-200 bg-leaf-50 px-4 py-4">
                <Text className="text-[20px] text-gray-500">Select Gender</Text>
              </View>
            </View>

            <View className="mb-3 flex-row">
              <View className="mr-3 flex-1 rounded-2xl border border-leaf-200 bg-leaf-50 px-4 py-4">
                <Text className="text-[20px] text-gray-500">Month</Text>
              </View>
              <View className="mr-3 w-24 rounded-2xl border border-leaf-200 bg-leaf-50 px-4 py-4">
                <Text className="text-[20px] text-gray-500">Day</Text>
              </View>
              <View className="w-24 rounded-2xl border border-leaf-200 bg-leaf-50 px-4 py-4">
                <Text className="text-[20px] text-gray-500">Year</Text>
              </View>
            </View>

            <TextInput
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              placeholder="Contact Number (11 digits)"
              placeholderTextColor="#6b7280"
              keyboardType="phone-pad"
              className="mb-3 rounded-2xl border border-leaf-200 bg-leaf-50 px-4 py-4 text-[20px] text-gray-900"
            />

            <TextInput
              value={address}
              onChangeText={setAddress}
              placeholder="Address"
              placeholderTextColor="#6b7280"
              autoCapitalize="words"
              className="mb-3 rounded-2xl border border-leaf-200 bg-leaf-50 px-4 py-4 text-[20px] text-gray-900"
            />

            <TextInput
              value={address}
              onChangeText={setAddress}
              placeholder="Street, purok, landmark, etc."
              placeholderTextColor="#6b7280"
              autoCapitalize="words"
              className="mb-3 rounded-2xl border border-leaf-200 bg-leaf-50 px-4 py-4 text-[20px] text-gray-900"
            />

            <View className="mb-3 rounded-2xl border border-leaf-200 bg-leaf-50 px-4 py-4">
              <Text className="text-[20px] text-gray-500">Select Region</Text>
            </View>

            <View className="mb-3 rounded-2xl border border-leaf-200 bg-leaf-50 px-4 py-4">
              <Text className="text-[20px] text-gray-500">Select Province</Text>
            </View>

            <View className="mb-3 rounded-2xl border border-leaf-200 bg-leaf-50 px-4 py-4">
              <Text className="text-[20px] text-gray-500">Select City / Municipality</Text>
            </View>

            <View className="mb-4 rounded-2xl border border-leaf-200 bg-leaf-50 px-4 py-4">
              <Text className="text-[20px] text-gray-500">Select Barangay</Text>
            </View>

            <Pressable
              onPress={handleRegister}
              className="items-center rounded-2xl bg-leaf-700 px-4 py-4"
            >
              <Text className="text-4xl font-bold text-white">Next Step →</Text>
            </Pressable>

            <Text className="mt-4 text-center text-[18px] text-gray-700">
              Already have an account?{' '}
              <Text className="font-bold text-leaf-700" onPress={() => router.push('/login')}>
                Log-in
              </Text>
            </Text>

            <Text className="mt-4 text-center text-[14px] text-gray-500">
              Step 1 of 2 • Secure Platform
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
