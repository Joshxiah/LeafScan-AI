/**
 * Bottom tab navigation for the signed-in farmer.
 *
 * Home · History · Scan (centre, raised) · Library · Setting
 *
 * Full-screen flows that should hide the tab bar (camera,
 * preview, the CAO report) live one level up in app/(app)/ and
 * are pushed over this navigator.
 */

import { Tabs } from 'expo-router';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppHeader } from '../../../src/components/AppHeader';
import { brand } from '../../../src/constants/theme';
import { useLanguage } from '../../../src/context/LanguageContext';

type TabName = 'home' | 'scan' | 'history' | 'library' | 'settings';

const ICONS: Record<TabName, keyof typeof Ionicons.glyphMap> = {
  home: 'home-outline',
  scan: 'camera-outline',
  history: 'time-outline',
  library: 'book-outline',
  settings: 'settings-outline',
};

export default function TabsLayout() {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();

  const labels: Record<TabName, string> = {
    home: t.tabs.home,
    scan: t.tabs.scans,
    history: t.tabs.history,
    library: t.tabs.library,
    settings: t.tabs.settings,
  };

  return (
    <Tabs
      screenOptions={({ route }) => {
        const name = route.name as TabName;
        return {
          headerShown: true,
          header: () => <AppHeader />,
          // Strong dark green for the selected tab so it clearly
          // stands out against the muted grey of the others.
          tabBarActiveTintColor: brand.accentDark,
          tabBarInactiveTintColor: brand.faint,
          tabBarStyle: {
            backgroundColor: '#ffffff',
            borderTopColor: brand.line,
            borderTopWidth: 1,
            // Explicit room for the icon AND the label, plus the
            // device's bottom safe-area inset (0 on web / older
            // phones). Without this the labels render past the
            // bottom edge and get clipped or dropped.
            height: 74 + insets.bottom,
            paddingTop: 10,
            // Let the raised Scan button poke above the bar.
            overflow: 'visible',
            paddingBottom: Math.max(insets.bottom, 14),
          },
          // Render the label ourselves so it is never auto-hidden
          // when the navigator thinks the bar is short.
          tabBarLabel: ({ color }) => (
            <Text style={{ color, fontSize: 11, fontWeight: '700', marginTop: 3 }}>
              {labels[name]}
            </Text>
          ),
          tabBarIcon: ({ color, focused }) =>
            name === 'scan' ? (
              // Centre button: a raised, larger circle so it stands
              // out from the other four tabs.
              <View
                style={{
                  width: 62,
                  height: 62,
                  borderRadius: 31,
                  marginTop: -30,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: focused ? brand.accentDark : brand.accent,
                  borderWidth: 4,
                  borderColor: '#ffffff',
                  elevation: 6,
                  shadowColor: '#000',
                  shadowOpacity: 0.2,
                  shadowRadius: 6,
                  shadowOffset: { width: 0, height: 3 },
                }}
              >
                <Ionicons name="camera" size={30} color="#ffffff" />
              </View>
            ) : (
              <Ionicons name={ICONS[name]} size={22} color={color} />
            ),
        };
      }}
    >
      <Tabs.Screen name="home" />
      <Tabs.Screen name="history" />
      <Tabs.Screen name="scan" />
      <Tabs.Screen name="library" />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}
