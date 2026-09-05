/**
 * A two-colour donut, used by the Home "Disease Distribution" card.
 *
 * Built on react-native-svg's <Circle strokeDasharray> trick: a
 * ring's stroke is dashed into one visible arc sized by percentage,
 * then a second ring is rotated 90deg (SVG's 0deg points right, the
 * design wants it to point up) and offset to draw the remainder.
 */

import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

export interface DonutSegment {
  value: number;
  color: string;
}

export function DonutChart({
  segments,
  size = 88,
  strokeWidth = 14,
  trackColor = '#EEF5EF',
}: {
  segments: DonutSegment[];
  size?: number;
  strokeWidth?: number;
  trackColor?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = segments.reduce((sum, s) => sum + s.value, 0) || 1;

  let offsetSoFar = 0;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        {/* Base track, visible where no segment covers it. */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
        />

        {segments.map((segment, i) => {
          const fraction = segment.value / total;
          const arcLength = fraction * circumference;
          // Start each arc where the previous one ended, and rotate
          // -90deg so the first segment starts at 12 o'clock.
          const dashOffset = circumference * (1 - offsetSoFar);
          offsetSoFar += fraction;

          if (fraction <= 0) return null;

          return (
            <Circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={segment.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${arcLength} ${circumference - arcLength}`}
              strokeDashoffset={dashOffset}
              strokeLinecap="butt"
              fill="none"
              rotation={-90}
              origin={`${size / 2}, ${size / 2}`}
            />
          );
        })}
      </Svg>
    </View>
  );
}
