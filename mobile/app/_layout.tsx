/**
 * Root layout for the LeafScan AI mobile application.
 *
 * Wraps the whole app in LanguageProvider (so every screen, even
 * the sign-in screen, can read useLanguage) and AuthProvider (so
 * every screen can read who is logged in via useAuth).
 */

import '../global.css';

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { LanguageProvider } from '../src/context/LanguageContext';
import { AuthProvider } from '../src/context/AuthContext';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <AuthProvider>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: '#ffffff' },
            }}
          />
          <StatusBar style="light" />
        </AuthProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}
