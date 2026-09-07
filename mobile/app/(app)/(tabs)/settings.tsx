/**
 * Settings tab.
 *
 * Route: /settings
 *
 * Shows the signed-in farmer's profile - editable, with a profile
 * picture taken or picked from the gallery - the language switch,
 * a shortcut to the CAO report, and sign-out (with a confirm
 * dialog). Profile data comes from AuthContext / GET /api/auth/me;
 * edits go through PATCH /api/auth/me (see src/services/profile.service.ts).
 *
 * The language names themselves ("English" / "Cebuano") are always
 * shown in their own language, never translated - the same
 * convention every language picker uses, so a farmer who picked
 * the wrong one by accident can still find their way back.
 */

import { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Modal,
  Image,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import { useAuth } from '../../../src/context/AuthContext';
import { useLanguage } from '../../../src/context/LanguageContext';
import { Language } from '../../../src/i18n/translations';
import { brand, shadows } from '../../../src/constants/theme';
import { mediaUrl } from '../../../src/utils/media';
import { CornType } from '../../../src/types';
import { uploadImage } from '../../../src/services/upload.service';
import { updateProfile } from '../../../src/services/profile.service';
import { getErrorMessage } from '../../../src/services/api';

const LANGUAGE_OPTIONS: { code: Language; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'ceb', label: 'Cebuano' },
];

const CORN_TYPES: CornType[] = ['white', 'yellow', 'both'];
const PHONE_RULE = /^(09\d{9}|\+639\d{9})$/;

export default function SettingsScreen() {
  const router = useRouter();
  const { user, token, logout, refreshUser } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  const [confirmVisible, setConfirmVisible] = useState(false);

  // ---------- Profile photo ----------
  const [photoMenuVisible, setPhotoMenuVisible] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

  // ---------- Edit profile ----------
  const [editVisible, setEditVisible] = useState(false);
  const [phone, setPhone] = useState('');
  const [barangay, setBarangay] = useState('');
  const [cornType, setCornType] = useState<CornType | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const initial = (user?.fullName?.charAt(0) ?? '?').toUpperCase();
  const avatarUri = mediaUrl(user?.avatarPath, token);

  const cornTypeLabel: Record<CornType, string> = {
    white: t.settings.cornTypeWhite,
    yellow: t.settings.cornTypeYellow,
    both: t.settings.cornTypeBoth,
  };

  async function handleLogout() {
    setConfirmVisible(false);
    await logout();
    router.replace('/login');
  }

  // ---------- Edit profile ----------
  function openEdit() {
    setEditError(null);
    setPhone(user?.phoneNumber ?? '');
    setBarangay(user?.farmerProfile?.address ?? '');
    setCornType(user?.farmerProfile?.cornType ?? null);
    setEditVisible(true);
  }

  async function handleSaveProfile() {
    setEditError(null);

    const cleanPhone = phone.trim();
    if (!PHONE_RULE.test(cleanPhone)) {
      setEditError(t.settings.profileErrorPhone);
      return;
    }

    setIsSaving(true);
    try {
      await updateProfile({
        phoneNumber: cleanPhone,
        address: barangay.trim(),
        cornType: cornType ?? undefined,
      });
      await refreshUser();
      setEditVisible(false);
    } catch (error) {
      setEditError(getErrorMessage(error, t.settings.profileErrorGeneric, t.apiErrors));
    } finally {
      setIsSaving(false);
    }
  }

  // ---------- Profile photo ----------
  async function pickAndUploadPhoto(useCamera: boolean) {
    setPhotoMenuVisible(false);
    setPhotoError(null);

    try {
      const permission = useCamera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        setPhotoError(t.settings.photoPermissionMessage);
        return;
      }

      const pickerOptions: ImagePicker.ImagePickerOptions = {
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        // A profile photo is a selfie, so open facing the farmer
        // rather than the world - the picker ignores this option
        // when picking from the gallery.
        ...(useCamera ? { cameraType: ImagePicker.CameraType.front } : {}),
      };

      const result = useCamera
        ? await ImagePicker.launchCameraAsync(pickerOptions)
        : await ImagePicker.launchImageLibraryAsync(pickerOptions);

      if (result.canceled) return;

      const asset = result.assets[0];
      if (!asset?.uri) return;

      setIsUploadingPhoto(true);
      const uploaded = await uploadImage(asset.uri);
      await updateProfile({ avatarPath: uploaded.imagePath });
      await refreshUser();
    } catch (error) {
      setPhotoError(getErrorMessage(error, t.settings.photoErrorGeneric, t.apiErrors));
    } finally {
      setIsUploadingPhoto(false);
    }
  }

  async function handleRemovePhoto() {
    setPhotoMenuVisible(false);
    setPhotoError(null);
    setIsUploadingPhoto(true);
    try {
      await updateProfile({ avatarPath: '' });
      await refreshUser();
    } catch (error) {
      setPhotoError(getErrorMessage(error, t.settings.photoErrorGeneric, t.apiErrors));
    } finally {
      setIsUploadingPhoto(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-[#F5FAF6]" edges={['top']}>
      <View className="px-6 pb-2 pt-4">
        <Text className="text-center text-[17px] font-bold text-[#16241B]">
          {t.settings.title}
        </Text>
      </View>

      <ScrollView
        contentContainerClassName="px-6 pb-10 pt-3"
        showsVerticalScrollIndicator={false}
      >
        {/* ---------- Profile card ---------- */}
        <View
          className="flex-row items-center rounded-2xl border border-[#EEF5EF] bg-white p-4"
          style={shadows.card}
        >
          <Pressable
            onPress={() => setPhotoMenuVisible(true)}
            disabled={isUploadingPhoto}
            className="relative h-14 w-14"
          >
            <View className="h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-[#E7F4EA]">
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} className="h-14 w-14" resizeMode="cover" />
              ) : (
                <Text className="text-lg font-extrabold text-[#2F6D46]">{initial}</Text>
              )}
              {isUploadingPhoto && (
                <View className="absolute inset-0 items-center justify-center bg-black/30">
                  <ActivityIndicator size="small" color="#ffffff" />
                </View>
              )}
            </View>
            <View
              className="absolute -bottom-0.5 -right-0.5 h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-[#2F6D46]"
              style={shadows.card}
            >
              <Ionicons name="camera" size={10} color="#ffffff" />
            </View>
          </Pressable>

          <View className="ml-3 flex-1">
            <Text
              className="text-[15px] font-extrabold text-[#16241B]"
              numberOfLines={1}
            >
              {user?.fullName ?? 'Farmer'}
            </Text>
            <Pressable
              onPress={() => router.push('/report')}
              className="mt-1.5 flex-row items-center self-start rounded-full bg-[#E7F4EA] px-3 py-1 active:opacity-80"
            >
              <Ionicons name="paper-plane-outline" size={12} color={brand.accent} />
              <Text className="ml-1 text-[12px] font-semibold text-[#2F6D46]">
                {t.settings.submitReport}
              </Text>
            </Pressable>
          </View>
        </View>

        {photoError && (
          <Text className="ml-1 mt-2 text-[12px] text-[#D64545]">{photoError}</Text>
        )}

        {/* ---------- Profile information ---------- */}
        <View className="mb-2 mt-6 flex-row items-center justify-between">
          <Text className="text-[11px] font-bold tracking-wide text-[#9BAAA1]">
            {t.settings.profileInfo}
          </Text>
          <Pressable
            onPress={openEdit}
            hitSlop={8}
            className="flex-row items-center gap-1 active:opacity-70"
          >
            <Ionicons name="pencil" size={12} color={brand.accent} />
            <Text className="text-[12px] font-bold text-[#2F6D46]">
              {t.settings.editProfile}
            </Text>
          </Pressable>
        </View>
        <View className="rounded-2xl border border-[#EEF5EF] bg-white px-4" style={shadows.card}>
          <InfoRow
            label={t.settings.phone}
            value={user?.phoneNumber ?? t.settings.notSet}
          />
          <InfoRow
            label={t.settings.barangay}
            value={user?.farmerProfile?.address ?? t.settings.notSet}
          />
          <InfoRow
            label={t.settings.mainCrop}
            value={
              user?.farmerProfile?.cornType
                ? cornTypeLabel[user.farmerProfile.cornType]
                : t.settings.notSet
            }
            isLast
          />
        </View>

        {/* ---------- Language ---------- */}
        <SectionLabel text={t.settings.language} />
        <View className="rounded-2xl border border-[#EEF5EF] bg-white px-4 py-1.5" style={shadows.card}>
          <View className="flex-row items-center py-2.5">
            <Ionicons name="globe-outline" size={16} color={brand.muted} />
            <Text className="ml-2 text-[13px] text-[#6C8073]">
              {t.settings.languageHint}
            </Text>
          </View>

          {LANGUAGE_OPTIONS.map((option, i) => {
            const selected = language === option.code;
            return (
              <Pressable
                key={option.code}
                onPress={() => setLanguage(option.code)}
                className={`flex-row items-center justify-between py-3 ${
                  i < LANGUAGE_OPTIONS.length - 1 ? 'border-b border-[#EEF5EF]' : ''
                }`}
              >
                <Text
                  className={`text-[14px] ${
                    selected ? 'font-semibold text-[#16241B]' : 'text-[#6C8073]'
                  }`}
                >
                  {option.label}
                </Text>
                {selected && (
                  <Ionicons name="checkmark" size={18} color={brand.accent} />
                )}
              </Pressable>
            );
          })}
        </View>

        {/* ---------- Log out ---------- */}
        <Pressable
          onPress={() => setConfirmVisible(true)}
          className="mt-7 h-14 flex-row items-center justify-center rounded-full border border-[#F0C9C9] bg-white active:bg-[#FBEDED]"
        >
          <Ionicons name="log-out-outline" size={18} color="#D64545" />
          <Text className="ml-2 text-[15px] font-bold text-[#D64545]">
            {t.settings.logOut}
          </Text>
        </Pressable>

        <Text className="mt-5 text-center text-[11px] text-[#9BAAA1]">
          {t.settings.footer}
        </Text>
      </ScrollView>

      {/* ---------- Photo action sheet ---------- */}
      <Modal
        visible={photoMenuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPhotoMenuVisible(false)}
      >
        <Pressable
          className="flex-1 items-center justify-end bg-black/40"
          onPress={() => setPhotoMenuVisible(false)}
        >
          <Pressable className="w-full rounded-t-3xl bg-white p-3 pb-8" onPress={() => {}}>
            <Text className="mb-2 mt-2 text-center text-[13px] font-bold text-[#9BAAA1]">
              {t.settings.changePhoto}
            </Text>

            <MenuAction
              icon="camera-outline"
              label={t.settings.takePhoto}
              onPress={() => pickAndUploadPhoto(true)}
            />
            <MenuAction
              icon="images-outline"
              label={t.settings.chooseFromGallery}
              onPress={() => pickAndUploadPhoto(false)}
            />
            {avatarUri && (
              <MenuAction
                icon="trash-outline"
                label={t.settings.removePhoto}
                color="#D64545"
                onPress={handleRemovePhoto}
              />
            )}
            <MenuAction
              icon="close-outline"
              label={t.common.cancel}
              onPress={() => setPhotoMenuVisible(false)}
            />
          </Pressable>
        </Pressable>
      </Modal>

      {/* ---------- Edit profile modal ---------- */}
      <Modal
        visible={editVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setEditVisible(false)}
      >
        <View className="flex-1 items-center justify-center bg-black/40 px-6">
          <View className="w-full rounded-2xl bg-white p-6">
            <Text className="text-center text-lg font-extrabold text-[#16241B]">
              {t.settings.editProfileTitle}
            </Text>

            <View className="mt-5 gap-4">
              <FieldInput
                icon="call-outline"
                placeholder={t.settings.phonePlaceholder}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
              <FieldInput
                icon="location-outline"
                placeholder={t.settings.barangayPlaceholder}
                value={barangay}
                onChangeText={setBarangay}
                autoCapitalize="words"
              />

              <View>
                <Text className="mb-2 text-[12px] font-bold text-[#9BAAA1]">
                  {t.settings.cornTypeLabel}
                </Text>
                <View className="flex-row gap-2">
                  {CORN_TYPES.map((option) => {
                    const selected = cornType === option;
                    return (
                      <Pressable
                        key={option}
                        onPress={() => setCornType(option)}
                        className={`flex-1 items-center rounded-full py-2 ${
                          selected ? 'bg-[#2F6D46]' : 'border border-[#DFEDE3] bg-white'
                        }`}
                      >
                        <Text
                          className={`text-[12px] font-semibold ${
                            selected ? 'text-white' : 'text-[#6C8073]'
                          }`}
                        >
                          {cornTypeLabel[option]}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </View>

            {editError && (
              <Text className="mt-3 text-[13px] text-[#D64545]">{editError}</Text>
            )}

            <View className="mt-6 flex-row gap-3">
              <Pressable
                onPress={() => setEditVisible(false)}
                disabled={isSaving}
                className="h-11 flex-1 items-center justify-center rounded-full border border-[#DFEDE3] bg-white active:bg-[#F5FAF6]"
              >
                <Text className="text-[14px] font-semibold text-[#6C8073]">
                  {t.common.cancel}
                </Text>
              </Pressable>
              <Pressable
                onPress={handleSaveProfile}
                disabled={isSaving}
                className="h-11 flex-1 flex-row items-center justify-center rounded-full bg-[#2F6D46] active:opacity-90 disabled:opacity-70"
              >
                {isSaving && (
                  <ActivityIndicator size="small" color="#ffffff" className="mr-2" />
                )}
                <Text className="text-[14px] font-bold text-white">
                  {isSaving ? t.settings.savingChanges : t.settings.saveChanges}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ---------- Log out confirmation ---------- */}
      <Modal
        visible={confirmVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmVisible(false)}
      >
        <View className="flex-1 items-center justify-center bg-black/40 px-8">
          <View className="w-full rounded-2xl bg-white p-6">
            <Pressable
              onPress={() => setConfirmVisible(false)}
              hitSlop={10}
              className="absolute right-4 top-4"
            >
              <Ionicons name="close" size={20} color={brand.faint} />
            </Pressable>

            <Text className="mt-2 text-center text-lg font-extrabold text-[#16241B]">
              {t.settings.logOutTitle}
            </Text>
            <Text className="mt-2 text-center text-[13px] leading-5 text-[#6C8073]">
              {t.settings.logOutMessage}
            </Text>

            <View className="mt-5 flex-row gap-3">
              <Pressable
                onPress={() => setConfirmVisible(false)}
                className="h-11 flex-1 items-center justify-center rounded-full border border-[#DFEDE3] bg-white active:bg-[#F5FAF6]"
              >
                <Text className="text-[14px] font-semibold text-[#6C8073]">
                  {t.common.cancel}
                </Text>
              </Pressable>
              <Pressable
                onPress={handleLogout}
                className="h-11 flex-1 items-center justify-center rounded-full bg-[#D64545] active:opacity-90"
              >
                <Text className="text-[14px] font-bold text-white">
                  {t.settings.yesLogOut}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function SectionLabel({ text }: { text: string }) {
  return (
    <Text className="mb-2 mt-6 text-[11px] font-bold tracking-wide text-[#9BAAA1]">
      {text}
    </Text>
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
      className={`flex-row items-center justify-between py-3.5 ${
        isLast ? '' : 'border-b border-[#EEF5EF]'
      }`}
    >
      <Text className="text-[13px] text-[#9BAAA1]">{label}</Text>
      <Text
        className="ml-4 flex-1 text-right text-[13px] font-medium text-[#16241B]"
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
}

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

function MenuAction({
  icon,
  label,
  onPress,
  color = brand.ink,
}: {
  icon: IoniconName;
  label: string;
  onPress: () => void;
  color?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3 rounded-xl px-3 py-3.5 active:bg-[#F5FAF6]"
    >
      <Ionicons name={icon} size={18} color={color} />
      <Text className="text-[14px] font-medium" style={{ color }}>
        {label}
      </Text>
    </Pressable>
  );
}

function FieldInput({
  icon,
  ...inputProps
}: {
  icon: IoniconName;
} & React.ComponentProps<typeof TextInput>) {
  return (
    <View className="h-12 flex-row items-center rounded-full border border-[#DFEDE3] bg-white px-4">
      <Ionicons name={icon} size={16} color={brand.muted} />
      <TextInput
        {...inputProps}
        placeholderTextColor={brand.placeholder}
        className="ml-2.5 flex-1 text-[14px] text-[#16241B]"
        style={{ paddingVertical: 0 }}
      />
    </View>
  );
}
