/**
 * Get Started Screen - the welcome screen for new users.
 *
 * Route: /get-started
 *
 * Explains what LeafScan AI does and offers two paths:
 * create an account, or log in to an existing one.
 */

import { View, Text, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function GetStartedScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <ScrollView
        contentContainerClassName="flex-grow px-6 py-8"
        showsVerticalScrollIndicator={false}
      >
        {/* ---------- Header ---------- */}
        <View className="items-center">
          <View className="h-24 w-24 items-center justify-center rounded-3xl bg-leaf-600">
            <Text className="text-4xl">🌽</Text>
          </View>

          <Text className="mt-5 text-3xl font-bold text-leaf-800">
            LeafScan AI
          </Text>

          <Text className="mt-2 text-center text-base text-gray-500">
            Detect corn leaf diseases using your phone camera
          </Text>
        </View>

        {/* ---------- What the app does ---------- */}
        <View className="mt-10">
          <FeatureRow
            icon="📷"
            title="Scan a corn leaf"
            description="Take a photo or choose one from your gallery."
          />
          <FeatureRow
            icon="🔬"
            title="Get instant results"
            description="Our AI identifies the disease and how confident it is."
          />
          <FeatureRow
            icon="💊"
            title="Receive expert advice"
            description="Treatment recommendations verified by the City Agriculture Office."
          />
          <FeatureRow
            icon="📊"
            title="Track your scans"
            description="Every detection is saved so you can review it later."
          />
        </View>

        {/* Pushes the buttons to the bottom on tall screens */}
        <View className="flex-1" />

        {/* ---------- Actions ---------- */}
        <View className="mt-10">
          <Pressable
            onPress={() => router.push('/register')}
            className="items-center rounded-xl bg-leaf-600 py-4 active:bg-leaf-700"
          >
            <Text className="text-base font-semibold text-white">
              Create an Account
            </Text>
          </Pressable>

          <Pressable
            onPress={() => router.push('/login')}
            className="mt-3 items-center rounded-xl border-2 border-leaf-600 py-4 active:bg-leaf-50"
          >
            <Text className="text-base font-semibold text-leaf-700">
              I already have an account
            </Text>
          </Pressable>
        </View>

        <Text className="mt-6 text-center text-xs text-gray-400">
          For corn farmers of Pagadian City
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

/**
 * One row in the feature list. Defined here because it is used
 * only on this screen; shared components go in src/components.
 */
function FeatureRow({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <View className="mb-5 flex-row items-start">
      <View className="h-11 w-11 items-center justify-center rounded-xl bg-leaf-50">
        <Text className="text-xl">{icon}</Text>
      </View>

      <View className="ml-4 flex-1">
        <Text className="text-base font-semibold text-gray-900">
          {title}
        </Text>
        <Text className="mt-0.5 text-sm text-gray-500">
          {description}
        </Text>
      </View>
    </View>
  );
}