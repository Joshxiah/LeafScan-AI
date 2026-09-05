/**
 * The "Scan Activity" bar chart on Home.
 *
 * Plain Views scaled to a fixed pixel height - no charting library
 * needed for seven bars. Height is proportional to the tallest day,
 * so the chart re-scales correctly no matter what the counts are.
 */

import { View, Text } from 'react-native';
import { brand } from '../constants/theme';
import { DayActivity } from '../data/scanStats';

const CHART_HEIGHT = 96;
const MIN_BAR_HEIGHT = 6;

export function WeeklyBarChart({ data }: { data: DayActivity[] }) {
  const max = Math.max(...data.map((d) => d.count), 1);

  return (
    <View className="flex-row items-end justify-between" style={{ height: CHART_HEIGHT + 20 }}>
      {data.map((d) => {
        const barHeight = Math.max(
          MIN_BAR_HEIGHT,
          Math.round((d.count / max) * CHART_HEIGHT)
        );

        return (
          <View key={d.day} className="flex-1 items-center">
            <View
              className="w-[60%] rounded-md"
              style={{ height: barHeight, backgroundColor: brand.accent }}
            />
            <Text className="mt-2 text-[10px] font-semibold text-[#9BAAA1]">
              {d.day}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
