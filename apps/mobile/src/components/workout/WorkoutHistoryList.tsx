import React from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import type { WorkoutSession } from '@fitness-tracker/shared';

function computeVolume(session: WorkoutSession): number {
  return session.loggedExercises.reduce(
    (total, ex) => total + ex.sets.reduce((sv, s) => sv + (s.completed ? s.weight * s.reps : 0), 0),
    0,
  );
}

interface Props {
  onSessionSelect?: (sessionId: string) => void;
}

export default function WorkoutHistoryList({ onSessionSelect }: Props) {
  const history = useSelector((state: RootState) => state.workout.history);

  if (history.length === 0) {
    return (
      <View style={styles.empty}>
        <Text variant="bodyMedium" style={styles.emptyText}>
          No workout history yet.
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={history}
      keyExtractor={(item) => item.id}
      scrollEnabled={false}
      renderItem={({ item }) => (
        <Card
          style={styles.card}
          onPress={onSessionSelect ? () => onSessionSelect(item.id) : undefined}
        >
          <Card.Content>
            <Text variant="titleSmall">{item.date}</Text>
            <Text variant="bodySmall" style={styles.detail}>
              {item.loggedExercises.length} exercises
            </Text>
            <Text variant="bodySmall" style={styles.detail}>
              Volume: {computeVolume(item).toLocaleString()} lbs
            </Text>
          </Card.Content>
        </Card>
      )}
    />
  );
}

const styles = StyleSheet.create({
  empty: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    color: '#999',
  },
  card: {
    marginBottom: 8,
  },
  detail: {
    color: '#666',
    marginTop: 2,
  },
});
