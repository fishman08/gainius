import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Text } from 'react-native-paper';
import Svg, { Rect } from 'react-native-svg';
import type { WeeklyVolume } from '@fitness-tracker/shared';
import { useAppTheme } from '../../providers/ThemeProvider';

interface VolumeChartProps {
  data: WeeklyVolume[];
}

const CHART_HEIGHT = 80;
const GAP = 5;

export default function VolumeChartComponent({ data }: VolumeChartProps) {
  const { theme } = useAppTheme();
  const screenWidth = Dimensions.get('window').width;
  const chartWidth = screenWidth - 32 - 28; // 16px padding each side, 14px inner padding x2

  if (data.length === 0) {
    return <Text style={[styles.empty, { color: theme.colors.textHint }]}>No volume data yet</Text>;
  }

  const displayed = data.slice(-8);
  const maxVol = Math.max(...displayed.map((d) => d.volume), 1);
  const barCount = displayed.length;
  const barW = (chartWidth - GAP * (barCount - 1)) / barCount;

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.colors.surface, borderColor: theme.colors.surfaceBorder },
      ]}
    >
      <Text style={[styles.overline, { color: theme.colors.textSecondary }]}>WEEKLY VOLUME</Text>
      <Svg width={chartWidth} height={CHART_HEIGHT + 16}>
        {displayed.map((d, i) => {
          const isLast = i === displayed.length - 1;
          const barH = Math.max(4, (d.volume / maxVol) * CHART_HEIGHT);
          const x = i * (barW + GAP);
          const y = CHART_HEIGHT - barH;
          return (
            <React.Fragment key={i}>
              <Rect
                x={x}
                y={y}
                width={barW}
                height={barH}
                rx={4}
                ry={2}
                fill={isLast ? theme.colors.primary : 'rgba(249,115,22,0.25)'}
                opacity={isLast ? undefined : 1}
              />
            </React.Fragment>
          );
        })}
      </Svg>
      {/* Week labels */}
      <View style={[styles.labels, { width: chartWidth }]}>
        {displayed.map((d, i) => (
          <Text
            key={i}
            style={[
              styles.weekLabel,
              {
                color: theme.colors.textHint,
                width: barW,
                marginRight: i < displayed.length - 1 ? GAP : 0,
              },
            ]}
          >
            {d.weekLabel}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 12,
    paddingHorizontal: 14,
    marginBottom: 10,
    borderWidth: 1,
  },
  overline: {
    fontFamily: 'BarlowCondensed_700Bold',
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  labels: {
    flexDirection: 'row',
    marginTop: 4,
  },
  weekLabel: {
    fontFamily: 'RethinkSans_400Regular',
    fontSize: 8,
    textAlign: 'center',
  },
  empty: {
    textAlign: 'center',
    marginVertical: 16,
    fontFamily: 'RethinkSans_400Regular',
    fontSize: 14,
  },
});
