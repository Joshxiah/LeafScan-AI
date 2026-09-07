/**
 * Notifications.
 *
 * Route: /notifications  (pushed from the Home header bell)
 *
 * What the CAO has done with the farmer's reports - verified,
 * agriculturist assigned, resolved - each with the CAO's message
 * when they left one. Unread items are bold with a dot until
 * tapped; pull down to refresh.
 */

import { useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useLanguage } from '../../src/context/LanguageContext';
import { useNotifications } from '../../src/context/NotificationsContext';
import EmptyState from '../../src/components/EmptyState';
import { brand, shadows } from '../../src/constants/theme';
import type { NotificationItem } from '../../src/services/notification.service';

function relativeTime(iso: string, t: ReturnType<typeof useLanguage>['t']): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return t.notifications.justNow;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return t.notifications.minutesAgo(minutes);
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t.notifications.hoursAgo(hours);
  const days = Math.floor(hours / 24);
  if (days < 7) return t.notifications.daysAgo(days);
  return new Date(iso).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const {
    notifications,
    unreadCount,
    isLoading,
    loadFailed,
    refresh,
    markRead,
    markAllRead,
  } = useNotifications();

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh])
  );

  return (
    <SafeAreaView className="flex-1 bg-[#F5FAF6]" edges={['top', 'bottom']}>
      {/* ---------- Header ---------- */}
      <View className="flex-row items-center px-4 py-3">
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          className="h-9 w-9 items-center justify-center"
        >
          <Ionicons name="arrow-back" size={22} color={brand.ink} />
        </Pressable>
        <Text className="flex-1 text-center text-[16px] font-bold text-[#16241B]">
          {t.notifications.title}
        </Text>
        {unreadCount > 0 ? (
          <Pressable onPress={() => void markAllRead()} hitSlop={8} className="px-1">
            <Text className="text-[12px] font-bold text-[#2F6D46]">
              {t.notifications.markAllRead}
            </Text>
          </Pressable>
        ) : (
          <View className="w-9" />
        )}
      </View>

      {loadFailed && notifications.length === 0 ? (
        <EmptyState
          icon="cloud-offline-outline"
          title={t.notifications.loadError}
          message=""
          actionLabel={t.notifications.retry}
          onAction={() => void refresh()}
        />
      ) : isLoading && notifications.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={brand.accent} />
        </View>
      ) : notifications.length === 0 ? (
        <EmptyState
          icon="notifications-outline"
          title={t.notifications.empty}
          message={t.notifications.emptyHint}
        />
      ) : (
        <ScrollView
          contentContainerClassName="px-5 pb-12 pt-2"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={() => void refresh()}
              tintColor={brand.accent}
            />
          }
        >
          <View className="gap-2.5">
            {notifications.map((item) => (
              <NotificationCard
                key={item.id}
                item={item}
                timeLabel={relativeTime(item.createdAt, t)}
                onPress={() => {
                  if (!item.isRead) void markRead(item.id);
                }}
              />
            ))}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function NotificationCard({
  item,
  timeLabel,
  onPress,
}: {
  item: NotificationItem;
  timeLabel: string;
  onPress: () => void;
}) {
  const unread = !item.isRead;
  return (
    <Pressable
      onPress={onPress}
      className={`flex-row rounded-2xl border p-3.5 active:opacity-90 ${
        unread ? 'border-[#CDE7D4] bg-[#EEF8F0]' : 'border-[#EEF5EF] bg-white'
      }`}
      style={shadows.card}
    >
      <View className="mr-3 mt-0.5">
        <View
          className={`h-9 w-9 items-center justify-center rounded-full ${
            unread ? 'bg-[#2F6D46]' : 'bg-[#E7F4EA]'
          }`}
        >
          <Ionicons
            name="leaf"
            size={16}
            color={unread ? '#ffffff' : brand.accent}
          />
        </View>
      </View>

      <View className="flex-1">
        <View className="flex-row items-start">
          <Text
            className={`flex-1 text-[14px] ${
              unread ? 'font-extrabold text-[#16241B]' : 'font-semibold text-[#3C4A41]'
            }`}
          >
            {item.title}
          </Text>
          {unread && (
            <View className="ml-2 mt-1 h-2 w-2 rounded-full bg-[#D64545]" />
          )}
        </View>

        {item.body ? (
          <Text className="mt-1 text-[12.5px] leading-5 text-[#6C8073]">{item.body}</Text>
        ) : null}

        <Text className="mt-1.5 text-[11px] text-[#9BAAA1]">{timeLabel}</Text>
      </View>
    </Pressable>
  );
}
