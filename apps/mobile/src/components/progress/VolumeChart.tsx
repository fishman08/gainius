import React, { useMemo } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { BarChart } from 'react-native-chart-kit';
import type { WeeklyVolume } from '@fitness-tracker/shared';
import { useAppTheme } from '../../providers/ThemeProvider';

interface VolumeChartProps {
  data: WeeklyVolume[];
}

const screenWidth = Dimensions.get('window').width;

/** Convert a hex color string to an rgba() string with the given opacity. */
function hexToRgba(hex: string, opacity: number): string {
  const stripped = hex.replace('#', '');
  const r = parseInt(stripped.substring(0, 2), 16);
  const g = parseInt(stripped.substring(2, 4), 16);
  const b = parseInt(stripped.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

export default function VolumeChartComponent({ data }: VolumeChartProps) {
  const { theme } = useAppTheme();

  const chartConfig = useMemo(
    () => ({
      backgroundColor: theme.colors.surface,
      backgroundGradientFrom: theme.colors.surface,
      backgroundGradientTo: theme.colors.surface,
      decimalPlaces: 0,
      color: (opacity = 1) => hexToRgba(theme.colors.primary, opacity),
      labelColor: () => theme.colors.textHint,
      barPercentage: 0.6,
    }),
    [theme],
  );

  if (data.length === 0) {
    return <Text style={[styles.empty, { color: theme.colors.textHint }]}>No volume data yet</Text>;
  }

  const chartData = {
    labels: data.map((d) => d.weekLabel),
    datasets: [{ data: data.map((d) => d.volume) }],
  };

  return (
    <View style={styles.container}>
      <Text variant="titleSmall" style={styles.title}>
        Weekly Volume (lbs)
      </Text>
      <BarChart
        data={chartData}
        width={screenWidth - 48}
        height={200}
        yAxisLabel=""
        yAxisSuffix=""
        chartConfig={chartConfig}
        style={styles.chart}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  title: { marginBottom: 8 },
  chart: { borderRadius: 12 },
  empty: { textAlign: 'center', marginVertical: 16 },
});
