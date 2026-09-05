/**
 * Bottom tab navigation for the signed-in farmer.
 *
 * Home · Scans · History · Library · Setting
 *
 * Full-screen flows that should hide the tab bar (camera,
 * preview, the CAO report) live one level up in app/(app)/ and
 * are pushed over this navigator.
 */

import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { brand } from '../../../src/constants/theme';
import { useLanguage } from '../../../src/context/LanguageContext';

export default function TabsLayout() {
  const { t } = useLanguage();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: brand.accent,
        tabBarInactiveTintColor: brand.faint,
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: brand.line,
          borderTopWidth: 1,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarItemStyle: { paddingTop: 4 },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: t.tabs.home,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: t.tabs.scans,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="camera-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: t.tabs.history,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="time-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: t.tabs.library,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="book-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t.tabs.settings,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
