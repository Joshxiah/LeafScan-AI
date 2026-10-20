/** Colour-coded pill showing which IPM level a treatment belongs to. */

import { CONTROL_LEVEL_BY_KEY } from '../constants/controlLevels';
import type { ControlLevel } from '../types';

export function ControlLevelBadge({ level }: { level: ControlLevel | null }) {
  if (!level) return null;
  const info = CONTROL_LEVEL_BY_KEY[level];

  return (
    <span
      className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold"
      style={{ backgroundColor: info.tint, color: info.color }}
      title={info.when}
    >
      Level {info.step} · {info.label}
    </span>
  );
}
