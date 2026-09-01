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

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleLogin() {
    setErrorMessage(null);

    if (!username.trim()) {
      setErrorMessage('Please enter your username.');
      return;
    }

    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    try {
      await login({ username: username.trim(), password });
      router.replace('/home');
    } catch (error) {
      setErrorMessage('Unable to log in right now. Please try again.');
      console.log('[login] failed', error);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerClassName="px-6 py-6"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text className="text-6xl font-bold text-leaf-800">Log in</Text>
          <Text className="mt-4 text-2xl text-gray-500">
            Sign in to continue checking your corn leaf scans.
          </Text>

          {errorMessage ? (
            <View className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <Text className="text-sm text-red-700">{errorMessage}</Text>
            </View>
          ) : null}

          <View className="mt-8">
            <Text className="mb-2 text-base text-gray-700">Username</Text>
            <TextInput
              value={username}
              onChangeText={setUsername}
              placeholder="farmer123"
              placeholderTextColor="#9ca3af"
              autoCapitalize="none"
              autoCorrect={false}
              className="rounded-2xl border border-gray-300 bg-gray-100 px-4 py-4 text-lg text-gray-900"
            />

            <Text className="mb-2 mt-5 text-base text-gray-700">Password</Text>
            <View className="flex-row items-center rounded-2xl border border-gray-300 bg-gray-100 pr-3">
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                placeholderTextColor="#9ca3af"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                className="flex-1 px-4 py-4 text-lg text-gray-900"
              />
              <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={8}>
                <Text className="text-sm font-medium text-leaf-700">
                  {showPassword ? 'Hide' : 'Show'}
                </Text>
              </Pressable>
            </View>
          </View>

          <Pressable
            onPress={handleLogin}
            className="mt-8 items-center rounded-2xl bg-leaf-700 py-4"
          >
            <Text className="text-3xl font-bold text-white">Continue</Text>
          </Pressable>

          <Pressable
            onPress={() => router.back()}
            className="mt-6 items-center rounded-2xl border-2 border-leaf-700 bg-white py-4"
          >
            <Text className="text-3xl font-bold text-leaf-700">Back</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
