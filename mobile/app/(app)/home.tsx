/**
 * Home / Dashboard Screen.
 *
 * Route: /home
 *
 * The main screen after login. Scanning is wired up in Phase 8,
 * and the history list in Phase 16.
 */

import { View, Text, Pressable, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '../../src/context/AuthContext';

export default function HomeScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();

  /** Asks before logging out, so a mis-tap is not destructive. */
  function handleLogout() {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/login');
        },
      },
    ]);
  }

  /** "Juan Dela Cruz" -> "Juan" */
  const firstName = user?.fullName.split(' ')[0] ?? 'Farmer';

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      <ScrollView
        contentContainerClassName="pb-10"
        showsVerticalScrollIndicator={false}
      >
        {/* ---------- Green header ---------- */}
        <View className="rounded-b-3xl bg-leaf-700 px-6 pb-8 pt-5">
          <View className="flex-row items-start justify-between">
            <View className="flex-1">
              <Text className="text-sm text-leaf-200">Welcome back,</Text>
              <Text className="mt-0.5 text-2xl font-bold text-white">
                {firstName}
              </Text>
                           {user?.farmerProfile?.address && (
                <Text className="mt-1 text-xs text-leaf-200">
                  {user.farmerProfile.address}
                </Text>
              )}
            </View>

            <Pressable
              onPress={() => router.push('/profile')}
              className="h-11 w-11 items-center justify-center rounded-full bg-leaf-600 active:bg-leaf-800"
            >
              <Text className="text-lg font-bold text-white">
                {firstName.charAt(0).toUpperCase()}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* ---------- Main action ---------- */}
        <View className="px-6">
          <Pressable
            onPress={() =>
              Alert.alert(
                'Coming in Phase 8',
                'The camera and gallery features are built in the next phase.'
              )
            }
            className="-mt-6 items-center rounded-2xl bg-white px-6 py-7 shadow-md active:bg-gray-50"
          >
            <View className="h-16 w-16 items-center justify-center rounded-2xl bg-leaf-50">
              <Text className="text-3xl">📷</Text>
            </View>

            <Text className="mt-4 text-lg font-bold text-gray-900">
              Scan a Corn Leaf
            </Text>
            <Text className="mt-1 text-center text-sm text-gray-500">
              Take a photo or choose one from your gallery
            </Text>
          </Pressable>
        </View>

        {/* ---------- Quick links ---------- */}
        <View className="mt-6 px-6">
          <Text className="mb-3 text-base font-semibold text-gray-900">
            Quick Actions
          </Text>

          <QuickAction
            icon="📊"
            title="Detection History"
            description="Review your previous scans"
            onPress={() =>
              Alert.alert(
                'Coming in Phase 16',
                'Detection history is built in a later phase.'
              )
            }
          />

          <QuickAction
            icon="👤"
            title="My Profile"
            description="View your account details"
            onPress={() => router.push('/profile')}
          />

          <QuickAction
            icon="🚪"
            title="Log Out"
            description="Sign out of your account"
            onPress={handleLogout}
          />
        </View>

        {/* ---------- Diseases this app detects ---------- */}
        <View className="mt-8 px-6">
          <Text className="mb-3 text-base font-semibold text-gray-900">
            Diseases We Detect
          </Text>

          <View className="rounded-2xl bg-white p-5">
            <DiseaseRow name="Common Rust" />
            <DiseaseRow name="Gray Leaf Spot" />
            <DiseaseRow name="Northern Leaf Blight" />
            <DiseaseRow name="Healthy Corn Leaf" isLast />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function QuickAction({
  icon,
  title,
  description,
  onPress,
}: {
  icon: string;
  title: string;
  description: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="mb-3 flex-row items-center rounded-2xl bg-white px-4 py-4 active:bg-gray-100"
    >
      <View className="h-11 w-11 items-center justify-center rounded-xl bg-leaf-50">
        <Text className="text-xl">{icon}</Text>
      </View>

      <View className="ml-4 flex-1">
        <Text className="text-base font-medium text-gray-900">{title}</Text>
        <Text className="mt-0.5 text-xs text-gray-500">{description}</Text>
      </View>

      <Text className="text-lg text-gray-400">›</Text>
    </Pressable>
  );
}

function DiseaseRow({ name, isLast }: { name: string; isLast?: boolean }) {
  return (
    <View
      className={`flex-row items-center ${
        isLast ? '' : 'mb-3 border-b border-gray-100 pb-3'
      }`}
    >
      <View className="h-2 w-2 rounded-full bg-leaf-500" />
      <Text className="ml-3 text-sm text-gray-700">{name}</Text>
    </View>
  );
}