import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

export default function EmptyPlanView() {
  return (
    <View style={styles.container}>
      <Text variant="headlineSmall" style={styles.title}>
        No workout plan yet
      </Text>
      <Text variant="bodyMedium" style={styles.hint}>
        Chat with your AI coach to create one!
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#f5f5f5',
  },
  title: {
    color: '#4A90E2',
    marginBottom: 8,
  },
  hint: {
    color: '#666',
    textAlign: 'center',
  },
});
