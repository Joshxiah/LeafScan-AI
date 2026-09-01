import { useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { Redirect, useRouter } from 'expo-router';

import { useAuth } from '../src/context/AuthContext';
import { colors } from '../src/constants/theme';

export default function LoadingScreen() {
  const router = useRouter();
  const { isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isLoading) {
      return;
    }

    const timer = setTimeout(() => {
      router.replace(isAuthenticated ? '/home' : '/get-started');
    }, 1200);

    return () => clearTimeout(timer);
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-leaf-700">
        <View className="h-28 w-28 items-center justify-center rounded-3xl bg-white">
          <Text className="text-5xl">🌽</Text>
        </View>

        <Text className="mt-6 text-4xl font-bold text-white">LeafScan AI</Text>
        <Text className="mt-2 text-center text-base text-leaf-100">
          Preparing your dashboard...
        </Text>

        <ActivityIndicator size="large" color={colors.white} className="mt-10" />
      </View>
    );
  }

  return <Redirect href={isAuthenticated ? '/home' : '/get-started'} />;
}
