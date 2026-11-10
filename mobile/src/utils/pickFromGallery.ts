/**
 * Opens the phone's gallery so the farmer can pick a corn-leaf photo.
 *
 * Shared by the Scan tab ("Choose from Gallery") and the preview screen
 * ("Choose Another Image"), so both ask for permission and report problems the
 * same way. There is no crop step here: the preview screen offers one, and the
 * model resizes the photo itself.
 */

import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

/** The `t.scan` strings this needs (the whole `t.scan` object can be passed in). */
interface GalleryTexts {
  permissionTitle: string;
  permissionMessage: string;
  errorTitle: string;
  errorImageUnreadable: string;
  errorGalleryOpen: string;
}

/**
 * Resolves to the picked photo's URI, or null if the farmer cancelled, denied
 * access, or the photo could not be read (they have already been told why).
 */
export async function pickFromGallery(texts: GalleryTexts): Promise<string | null> {
  try {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(texts.permissionTitle, texts.permissionMessage);
      return null;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });

    if (result.canceled) return null;

    const uri = result.assets[0]?.uri;
    if (!uri) {
      Alert.alert(texts.errorTitle, texts.errorImageUnreadable);
      return null;
    }

    return uri;
  } catch (error) {
    console.error('[gallery] Gallery error:', error);
    Alert.alert(texts.errorTitle, texts.errorGalleryOpen);
    return null;
  }
}
