/**
 * Profile Screen.
 *
 * Route: /profile
 *
 * Displays the logged-in user's account and farming details.
 * The data comes from AuthContext, which fetched it from
 * GET /api/auth/me.
 */

import { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Alert,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '../../src/context/AuthContext';
import { colors } from '../../src/constants/theme';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, refreshUser } = useAuth();

  const [isRefreshing, setIsRefreshing] = useState(false);

  async function handleRefresh() {
    setIsRefreshing(true);
    await refreshUser();
    setIsRefreshing(false);
  }

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

  const profile = user?.farmerProfile;

  /** "2026-08-31T07:14:22.000Z" -> "August 31, 2026" */
  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-PH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '-';

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      <ScrollView
        contentContainerClassName="pb-10"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.leaf[600]}
          />
        }
      >
        {/* ---------- Header ---------- */}
        <View className="rounded-b-3xl bg-leaf-700 px-6 pb-10 pt-4">
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <Text className="text-base text-leaf-100">‹ Back</Text>
          </Pressable>

          <View className="mt-5 items-center">
            <View className="h-20 w-20 items-center justify-center rounded-full bg-white">
              <Text className="text-2xl font-bold text-leaf-700">
                {user?.fullName.charAt(0).toUpperCase() ?? '?'}
              </Text>
            </View>

            <Text className="mt-3 text-xl font-bold text-white">
              {user?.fullName ?? '-'}
            </Text>
            <Text className="mt-0.5 text-sm text-leaf-200">
              {user?.email ?? '-'}
            </Text>
          </View>
        </View>

        {/* ---------- Account ---------- */}
        <View className="mx-6 -mt-6 rounded-2xl bg-white p-5">
          <Text className="mb-4 text-base font-semibold text-gray-900">
            Account Information
          </Text>

          <InfoRow label="Full Name" value={user?.fullName ?? '-'} />
          <InfoRow label="Email" value={user?.email ?? '-'} />
          <InfoRow label="Phone Number" value={user?.phoneNumber ?? 'Not set'} />
          <InfoRow
            label="Account Type"
            value={user?.role === 'farmer' ? 'Farmer' : 'CAO Personnel'}
          />
          <InfoRow label="Member Since" value={memberSince} isLast />
        </View>

        {/* ---------- Farming details ---------- */}
        {user?.role === 'farmer' && (
          <View className="mx-6 mt-4 rounded-2xl bg-white p-5">
            <Text className="mb-4 text-base font-semibold text-gray-900">
              Farming Details
            </Text>

            <InfoRow label="Address" value={profile?.address ?? 'Not set'} />            <InfoRow
              label="Municipality"
              value={profile?.municipality ?? 'Not set'}
            />
            <InfoRow
              label="Corn Type"
              value={
                profile?.cornType
                  ? profile.cornType === 'both'
                    ? 'White and Yellow'
                    : `${profile.cornType.charAt(0).toUpperCase()}${profile.cornType.slice(1)} Corn`
                  : 'Not set'
              }
            />
            <InfoRow
              label="Farm Size"
              value={
                profile?.farmSizeHectares
                  ? `${profile.farmSizeHectares} hectares`
                  : 'Not set'
              }
            />
            <InfoRow
              label="Years Farming"
              value={
                profile?.yearsFarming !== null &&
                profile?.yearsFarming !== undefined
                  ? `${profile.yearsFarming} years`
                  : 'Not set'
              }
              isLast
            />
          </View>
        )}

        {/* ---------- Logout ---------- */}
        <View className="mx-6 mt-6">
          <Pressable
            onPress={handleLogout}
            className="items-center rounded-xl border border-red-200 bg-white py-4 active:bg-red-50"
          >
            <Text className="text-base font-semibold text-red-600">Log Out</Text>
          </Pressable>
        </View>

        <Text className="mt-6 text-center text-xs text-gray-400">
          LeafScan AI · Pagadian City
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({
  label,
  value,
  isLast,
}: {
  label: string;
  value: string;
  isLast?: boolean;
}) {
  return (
    <View
      className={`flex-row items-center justify-between ${
        isLast ? '' : 'mb-3 border-b border-gray-100 pb-3'
      }`}
    >
      <Text className="text-sm text-gray-500">{label}</Text>
      <Text className="ml-4 flex-1 text-right text-sm font-medium text-gray-900">
        {value}
      </Text>
    </View>
  );
}