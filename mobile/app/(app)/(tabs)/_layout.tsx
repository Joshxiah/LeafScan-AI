/**
 * Bottom tab navigation for the signed-in farmer.
 *
 * Home · History · Scan (centre, raised) · Library · Settings
 *
 * Home keeps the big logo header (<AppHeader>); every other tab gets
 * the compact <AppBar> with its own screen title.
 *
 * Full-screen flows that should hide the tab bar (camera,
 * preview, the CAO report) live one level up in app/(app)/ and
 * are pushed over this navigator.
 */

import { Tabs, useRouter } from 'expo-router';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppBar } from '../../../src/components/AppBar';
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
  const router = useRouter();

  const labels: Record<TabName, string> = {
    home: t.tabs.home,
    scan: t.tabs.scans,
    history: t.tabs.history,
    library: t.tabs.library,
    settings: t.tabs.settings,
  };

  // App-bar title of each inner tab (Home has none: it keeps the big header).
  const titles: Record<Exclude<TabName, 'home'>, string> = {
    scan: t.scan.title,
    history: t.history.title,
    library: t.library.title,
    settings: t.settings.title,
  };

  return (
    <Tabs
      screenOptions={({ route }) => {
        const name = route.name as TabName;
        return {
          headerShown: true,
          header: () =>
            name === 'home' ? <AppHeader /> : <AppBar title={titles[name]} />,
          // Strong dark green for the selected tab so it clearly
          // stands out against the muted grey of the others.
          tabBarActiveTintColor: brand.accentDark,
          tabBarInactiveTintColor: brand.faint,
          // Trim the default side padding so each label gets the
          // full width of its slot.
          tabBarItemStyle: { paddingHorizontal: 0 },
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
          //
          // Always one line: longer Cebuano labels such as
          // "Kasaysayan" are wider than a tab slot and used to wrap
          // ("Kasaysaya / n") and push into the bar's bottom edge.
          // adjustsFontSizeToFit shrinks the text just enough to fit,
          // and allowFontScaling={false} stops a large system font
          // size from making the labels wider than the slot again.
          tabBarLabel: ({ color }) => (
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
              allowFontScaling={false}
              style={{
                color,
                fontSize: 11,
                fontWeight: '700',
                marginTop: 3,
                maxWidth: '100%',
                textAlign: 'center',
              }}
            >
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
      {/* The raised centre button is an action, not a place: it opens the camera
          directly (which also has the gallery button) instead of switching tabs. */}
      <Tabs.Screen
        name="scan"
        listeners={{
          tabPress: (event) => {
            event.preventDefault();
            router.push('/camera');
          },
        }}
      />
      <Tabs.Screen name="library" />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}
