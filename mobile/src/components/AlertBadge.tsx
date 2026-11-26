/**
 * Round red badge with a warning icon, at the left of the red error boxes
 * (the Preview screen's upload error and <InvalidImageError>).
 */

import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function AlertBadge() {
  return (
    <View className="h-9 w-9 items-center justify-center rounded-full bg-red-100">
      <Ionicons name="alert-circle" size={22} color="#B91C1C" />
    </View>
  );
}
