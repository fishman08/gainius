import React from 'react';
import { StyleSheet } from 'react-native';
import { Card, Text } from 'react-native-paper';

interface StatCardProps {
  label: string;
  value: string | number;
}

export default function StatCard({ label, value }: StatCardProps) {
  return (
    <Card style={styles.card}>
      <Card.Content style={styles.content}>
        <Text variant="headlineSmall" style={styles.value}>
          {value}
        </Text>
        <Text variant="labelSmall" style={styles.label}>
          {label}
        </Text>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1 },
  content: { alignItems: 'center', paddingVertical: 12 },
  value: { fontWeight: '700', color: '#333' },
  label: { color: '#888', marginTop: 2 },
});
