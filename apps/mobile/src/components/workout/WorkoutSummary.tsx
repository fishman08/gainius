import React from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { Card, Text, Button } from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../../store';
import { clearActiveSession } from '../../store/slices/workoutSlice';

interface Props {
  onDone: () => void;
}

function formatDuration(startTime: string, endTime?: string): string {
  if (!endTime) return '--';
  const ms = new Date(endTime).getTime() - new Date(startTime).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  const remainMins = mins % 60;
  return `${hrs}h ${remainMins}m`;
}

export default function WorkoutSummary({ onDone }: Props) {
  const dispatch = useDispatch();
  const session = useSelector((state: RootState) => state.workout.history[0]);
  const currentPlan = useSelector((state: RootState) => state.workout.currentPlan);

  if (!session) return null;

  const completedExercises = session.loggedExercises.filter((ex) =>
    ex.sets.some((s) => s.completed),
  ).length;

  const totalVolume = session.loggedExercises.reduce((vol, ex) => {
    return vol + ex.sets.reduce((sv, s) => sv + (s.completed ? s.weight * s.reps : 0), 0);
  }, 0);

  const planExercises = currentPlan?.exercises ?? [];

  const handleDone = () => {
    dispatch(clearActiveSession());
    onDone();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text variant="headlineSmall" style={styles.heading}>
        Workout Complete
      </Text>

      <Card style={styles.summaryCard}>
        <Card.Content>
          <View style={styles.statRow}>
            <Text variant="bodyMedium">Date</Text>
            <Text variant="bodyMedium">{session.date}</Text>
          </View>
          <View style={styles.statRow}>
            <Text variant="bodyMedium">Duration</Text>
            <Text variant="bodyMedium">{formatDuration(session.startTime, session.endTime)}</Text>
          </View>
          <View style={styles.statRow}>
            <Text variant="bodyMedium">Exercises</Text>
            <Text variant="bodyMedium">
              {completedExercises} / {session.loggedExercises.length}
            </Text>
          </View>
          <View style={styles.statRow}>
            <Text variant="bodyMedium">Total Volume</Text>
            <Text variant="bodyMedium">{totalVolume.toLocaleString()} lbs</Text>
          </View>
        </Card.Content>
      </Card>

      <Text variant="titleMedium" style={styles.detailHeading}>
        Exercise Details
      </Text>

      {session.loggedExercises.map((ex) => {
        const planned = planExercises.find((pe) => pe.id === ex.plannedExerciseId);
        const completedSets = ex.sets.filter((s) => s.completed).length;
        return (
          <Card key={ex.id} style={styles.exerciseCard}>
            <Card.Content>
              <Text variant="titleSmall">{ex.exerciseName}</Text>
              <Text variant="bodySmall" style={styles.detail}>
                Completed: {completedSets} / {ex.sets.length} sets
              </Text>
              {planned && (
                <Text variant="bodySmall" style={styles.target}>
                  Target: {planned.targetSets}x{planned.targetReps}
                  {planned.suggestedWeight ? ` @ ${planned.suggestedWeight} lbs` : ''}
                </Text>
              )}
            </Card.Content>
          </Card>
        );
      })}

      <Button mode="contained" onPress={handleDone} style={styles.doneButton}>
        Done
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 16, paddingBottom: 32 },
  heading: { textAlign: 'center', marginBottom: 16, color: '#4CAF50' },
  summaryCard: { marginBottom: 16 },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  detailHeading: { marginBottom: 8, marginTop: 8 },
  exerciseCard: { marginBottom: 8 },
  detail: { color: '#333', marginTop: 2 },
  target: { color: '#666', marginTop: 2 },
  doneButton: { marginTop: 16 },
});
