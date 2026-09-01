import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function RegisterScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <View className="flex-1 justify-center px-6">
        <Text className="text-3xl font-bold text-leaf-800">Create account</Text>
        <Text className="mt-2 text-base text-gray-500">
          Register to start detecting corn leaf diseases with LeafScan AI.
        </Text>

        <View className="mt-8 rounded-2xl border border-gray-200 bg-gray-50 p-4">
          <Text className="text-sm text-gray-500">Full name</Text>
          <Text className="mt-2 text-base text-gray-900">Corn Farmer</Text>
        </View>

        <View className="mt-4 rounded-2xl border border-gray-200 bg-gray-50 p-4">
          <Text className="text-sm text-gray-500">Municipality</Text>
          <Text className="mt-2 text-base text-gray-900">Pagadian City</Text>
        </View>

        <Pressable
          onPress={() => router.replace('/')}
          className="mt-8 items-center rounded-xl bg-leaf-600 py-4"
        >
          <Text className="text-base font-semibold text-white">Create account</Text>
        </Pressable>

        <Pressable
          onPress={() => router.back()}
          className="mt-3 items-center rounded-xl border-2 border-leaf-600 py-4"
        >
          <Text className="text-base font-semibold text-leaf-700">Back</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
