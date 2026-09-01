/**
 * Layout for screens that require a logged-in farmer.
 *
 * Every screen placed inside app/(app)/ is automatically
 * protected by this guard. There is no way to reach one of them
 * without a valid session.
 */

import { View, ActivityIndicator } from 'react-native';
import { Stack, Redirect } from 'expo-router';

import { useAuth } from '../../src/context/AuthContext';
import { colors } from '../../src/constants/theme';

export default function ProtectedLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  // Still checking the saved token - show a spinner rather than
  // briefly flashing the login screen.
  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color={colors.leaf[600]} />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}