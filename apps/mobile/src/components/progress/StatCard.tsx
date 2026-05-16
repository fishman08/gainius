import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { useAppTheme } from '../../providers/ThemeProvider';

interface StatCardProps {
  label: string;
  value: string | number;
  highlight?: boolean;
}

export default function StatCard({ label, value, highlight }: StatCardProps) {
  const { theme } = useAppTheme();

  return (
    <View
      style={[
        styles.tile,
        {
          backgroundColor: highlight ? theme.colors.primaryMuted : theme.colors.surface,
          borderColor: highlight ? 'rgba(249,115,22,0.2)' : theme.colors.surfaceBorder,
        },
      ]}
    >
      <Text
        style={[
          styles.value,
          {
            color: highlight ? theme.colors.primary : theme.colors.text,
            fontVariant: ['tabular-nums'],
          },
        ]}
      >
        {value}
      </Text>
      <Text style={[styles.label, { color: theme.colors.textSecondary }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    paddingHorizontal: 14,
  },
  value: {
    fontFamily: 'BarlowCondensed_700Bold',
    fontSize: 34,
    lineHeight: 34,
  },
  label: {
    fontFamily: 'RethinkSans_600SemiBold',
    fontSize: 11,
    marginTop: 4,
  },
});
