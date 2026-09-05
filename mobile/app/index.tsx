/**
 * Splash Screen.
 *
 * Route: /
 *
 * Shows the brand mark for a fixed two seconds while AuthContext
 * checks for a saved token, then hands off:
 *
 *   token valid   -> /home
 *   no token      -> /login
 */

import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../src/context/AuthContext';
import { useLanguage } from '../src/context/LanguageContext';

/** How long the splash stays up, regardless of how fast auth resolves. */
const SPLASH_DURATION_MS = 2000;

export default function SplashScreen() {
  const { isLoading, isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMinTimeElapsed(true), SPLASH_DURATION_MS);
    return () => clearTimeout(timer);
  }, []);

  // Hold the splash for the full two seconds AND until the saved
  // token has been checked, then move on. <Redirect> is safer than
  // router.replace in an effect - it cannot fire before navigation
  // is ready.
  if (minTimeElapsed && !isLoading) {
    return <Redirect href={isAuthenticated ? '/home' : '/login'} />;
  }

  return (
    <View className="flex-1 items-center justify-center bg-[#2F6D46] px-8">
      <StatusBar style="light" />

      <View
        className="h-20 w-20 items-center justify-center rounded-3xl"
        style={{ backgroundColor: 'rgba(255,255,255,0.16)' }}
      >
        <Ionicons name="leaf" size={40} color="#ffffff" />
      </View>

      <Text className="mt-5 text-2xl font-extrabold tracking-wide text-white">
        LeafScan AI
      </Text>

      <Text className="mt-1.5 text-center text-sm text-white/80">
        {t.splash.tagline}
      </Text>

      <ActivityIndicator size="small" color="#ffffff" className="mt-8" />
    </View>
  );
}
