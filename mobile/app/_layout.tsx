/**
 * Root layout for the LeafScan AI mobile application.
 *
 * Wraps the whole app in AuthProvider, so every screen can read
 * who is logged in via the useAuth hook.
 */

import '../global.css';

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider } from '../src/context/AuthContext';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#ffffff' },
          }}
        />
        <StatusBar style="light" />
      </AuthProvider>
    </SafeAreaProvider>
  );
}