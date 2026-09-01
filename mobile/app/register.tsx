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

export default function RegisterScreen() {
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function handleRegister() {
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

    router.replace('/home');
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
          <Text className="text-5xl font-bold text-leaf-800">Create account</Text>
          <Text className="mt-4 text-2xl text-gray-500">
            Register to start detecting corn leaf diseases with LeafScan AI.
          </Text>

          {errorMessage ? (
            <View className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <Text className="text-sm text-red-700">{errorMessage}</Text>
            </View>
          ) : null}

          <View className="mt-8">
            <Text className="mb-2 text-base text-gray-700">
              Full Name <Text className="text-red-500">*</Text>
            </Text>
            <TextInput
              value={fullName}
              onChangeText={setFullName}
              placeholder="Juan Dela Cruz"
              placeholderTextColor="#9ca3af"
              autoCapitalize="words"
              className="rounded-2xl border border-gray-300 bg-gray-100 px-4 py-4 text-lg text-gray-900"
            />

            <Text className="mb-2 mt-5 text-base text-gray-700">
              Username <Text className="text-red-500">*</Text>
            </Text>
            <TextInput
              value={username}
              onChangeText={setUsername}
              placeholder="farmer123"
              placeholderTextColor="#9ca3af"
              autoCapitalize="none"
              autoCorrect={false}
              className="rounded-2xl border border-gray-300 bg-gray-100 px-4 py-4 text-lg text-gray-900"
            />

            <Text className="mb-2 mt-5 text-base text-gray-700">
              Password <Text className="text-red-500">*</Text>
            </Text>
            <View className="flex-row items-center rounded-2xl border border-gray-300 bg-gray-100 pr-3">
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Enter password"
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

            <Text className="mb-2 mt-5 text-base text-gray-700">
              Confirm Password <Text className="text-red-500">*</Text>
            </Text>
            <View className="flex-row items-center rounded-2xl border border-gray-300 bg-gray-100 pr-3">
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Re-enter password"
                placeholderTextColor="#9ca3af"
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                className="flex-1 px-4 py-4 text-lg text-gray-900"
              />
              <Pressable
                onPress={() => setShowConfirmPassword((v) => !v)}
                hitSlop={8}
              >
                <Text className="text-sm font-medium text-leaf-700">
                  {showConfirmPassword ? 'Hide' : 'Show'}
                </Text>
              </Pressable>
            </View>

            <Text className="mb-2 mt-5 text-base text-gray-700">Phone Number</Text>
            <TextInput
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              placeholder="09171234567"
              placeholderTextColor="#9ca3af"
              keyboardType="phone-pad"
              className="rounded-2xl border border-gray-300 bg-gray-100 px-4 py-4 text-lg text-gray-900"
            />

            <Text className="mb-2 mt-5 text-base text-gray-700">Address</Text>
            <TextInput
              value={address}
              onChangeText={setAddress}
              placeholder="Barangay San Jose, Pagadian City"
              placeholderTextColor="#9ca3af"
              autoCapitalize="words"
              multiline
              className="min-h-[90px] rounded-2xl border border-gray-300 bg-gray-100 px-4 py-4 text-lg text-gray-900"
              style={{ textAlignVertical: 'top' }}
            />
          </View>

          <Pressable
            onPress={handleRegister}
            className="mt-8 items-center rounded-2xl bg-leaf-700 py-4"
          >
            <Text className="text-3xl font-bold text-white">Create account</Text>
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
