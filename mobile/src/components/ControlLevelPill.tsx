/** Colour-coded pill showing which IPM level a treatment belongs to. */

import { View, Text } from 'react-native';

import { CONTROL_LEVEL_STYLE } from '../constants/controlLevels';
import { useLanguage } from '../context/LanguageContext';
import type { ControlLevel } from '../types';

export function ControlLevelPill({ level }: { level: ControlLevel | null }) {
  const { t } = useLanguage();
  if (!level) return null;

  const style = CONTROL_LEVEL_STYLE[level];
  return (
    <View
      className="self-start rounded-full px-2.5 py-1"
      style={{ backgroundColor: style.tint }}
    >
      <Text className="text-[11px] font-bold" style={{ color: style.color }}>
        {t.treatmentLevels.level} {style.step} · {t.treatmentLevels[level].label}
      </Text>
    </View>
  );
}
