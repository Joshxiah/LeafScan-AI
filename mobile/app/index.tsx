/**
 * Splash Screen.
 *
 * Route: /
 *
 * Shows branding while AuthContext checks for a saved token,
 * then sends the user to the right place:
 *
 *   token valid   -> /home
 *   no token      -> /get-started
 */

import { View, Text, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';

import { useAuth } from '../src/context/AuthContext';
import { colors } from '../src/constants/theme';

export default function SplashScreen() {
  const { isLoading, isAuthenticated } = useAuth();

  // Once the check finishes, hand over to the right screen.
  // <Redirect> is safer than calling router.replace inside an
  // effect, because it cannot fire before navigation is ready.
  if (!isLoading) {
    return <Redirect href={isAuthenticated ? '/home' : '/get-started'} />;
  }

  return (
    <View className="flex-1 items-center justify-center bg-leaf-700">
      <View className="h-28 w-28 items-center justify-center rounded-3xl bg-white">
        <Text className="text-5xl">🌽</Text>
      </View>

      <Text className="mt-6 text-4xl font-bold text-white">LeafScan AI</Text>

      <Text className="mt-2 text-center text-base text-leaf-100">
        Corn Leaf Disease Detection
      </Text>

      <ActivityIndicator size="large" color={colors.white} className="mt-12" />

      <View className="absolute bottom-10 items-center">
        <Text className="text-xs text-leaf-200">City Agriculture Office</Text>
        <Text className="text-xs text-leaf-200">Pagadian City</Text>
      </View>
    </View>
  );
}