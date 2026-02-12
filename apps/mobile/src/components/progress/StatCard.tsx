import React from 'react';
import { StyleSheet } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { useAppTheme } from '../../providers/ThemeProvider';

interface StatCardProps {
  label: string;
  value: string | number;
}

export default function StatCard({ label, value }: StatCardProps) {
  const { theme } = useAppTheme();

  return (
    <Card style={styles.card}>
      <Card.Content style={styles.content}>
        <Text variant="headlineSmall" style={[styles.value, { color: theme.colors.text }]}>
          {value}
        </Text>
        <Text variant="labelSmall" style={[styles.label, { color: theme.colors.textHint }]}>
          {label}
        </Text>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1 },
  content: { alignItems: 'center', paddingVertical: 12 },
  value: { fontWeight: '700' },
  label: { marginTop: 2 },
});
