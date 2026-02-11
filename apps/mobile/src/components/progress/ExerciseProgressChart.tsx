import React from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { LineChart } from 'react-native-chart-kit';
import type { ExerciseAnalytics } from '@fitness-tracker/shared';

interface ExerciseProgressChartProps {
  analytics: ExerciseAnalytics;
}

const screenWidth = Dimensions.get('window').width;

export default function ExerciseProgressChartComponent({ analytics }: ExerciseProgressChartProps) {
  if (analytics.dataPoints.length === 0) {
    return <Text style={styles.empty}>No data yet</Text>;
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
        chartConfig={{
          backgroundColor: '#fff',
          backgroundGradientFrom: '#fff',
          backgroundGradientTo: '#fff',
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(74, 144, 226, ${opacity})`,
          labelColor: () => '#888',
          propsForDots: { r: '4', strokeWidth: '2', stroke: '#4A90E2' },
        }}
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
  empty: { color: '#999', textAlign: 'center', marginVertical: 16 },
});
