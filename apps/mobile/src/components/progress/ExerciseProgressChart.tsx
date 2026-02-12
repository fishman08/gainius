import React, { useMemo } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { LineChart } from 'react-native-chart-kit';
import type { ExerciseAnalytics } from '@fitness-tracker/shared';
import { useAppTheme } from '../../providers/ThemeProvider';

interface ExerciseProgressChartProps {
  analytics: ExerciseAnalytics;
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

export default function ExerciseProgressChartComponent({ analytics }: ExerciseProgressChartProps) {
  const { theme } = useAppTheme();

  const chartConfig = useMemo(
    () => ({
      backgroundColor: theme.colors.surface,
      backgroundGradientFrom: theme.colors.surface,
      backgroundGradientTo: theme.colors.surface,
      decimalPlaces: 0,
      color: (opacity = 1) => hexToRgba(theme.colors.primary, opacity),
      labelColor: () => theme.colors.textHint,
      propsForDots: { r: '4', strokeWidth: '2', stroke: theme.colors.primary },
    }),
    [theme],
  );

  if (analytics.dataPoints.length === 0) {
    return <Text style={[styles.empty, { color: theme.colors.textHint }]}>No data yet</Text>;
  }

  // Aggregate best weight per date
  const byDate = new Map<string, number>();
  for (const dp of analytics.dataPoints) {
    const existing = byDate.get(dp.date) ?? 0;
    if (dp.weight > existing) byDate.set(dp.date, dp.weight);
  }

  const entries = Array.from(byDate.entries()).sort(([a], [b]) => a.localeCompare(b));

  const chartData = {
    labels: entries.map(([date]) => {
      const d = new Date(date);
      return `${d.getMonth() + 1}/${d.getDate()}`;
    }),
    datasets: [{ data: entries.map(([, weight]) => weight) }],
  };

  return (
    <View style={styles.container}>
      <Text variant="titleSmall" style={styles.title}>
        {analytics.exerciseName} — Weight Over Time
      </Text>
      <LineChart
        data={chartData}
        width={screenWidth - 48}
        height={200}
        yAxisSuffix=" lbs"
        chartConfig={chartConfig}
        bezier
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
