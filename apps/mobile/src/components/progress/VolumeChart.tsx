import React from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { BarChart } from 'react-native-chart-kit';
import type { WeeklyVolume } from '@fitness-tracker/shared';

interface VolumeChartProps {
  data: WeeklyVolume[];
}

const screenWidth = Dimensions.get('window').width;

export default function VolumeChartComponent({ data }: VolumeChartProps) {
  if (data.length === 0) {
    return <Text style={styles.empty}>No volume data yet</Text>;
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
        chartConfig={{
          backgroundColor: '#fff',
          backgroundGradientFrom: '#fff',
          backgroundGradientTo: '#fff',
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(74, 144, 226, ${opacity})`,
          labelColor: () => '#888',
          barPercentage: 0.6,
        }}
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
