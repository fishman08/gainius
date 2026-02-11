import React, { useEffect } from 'react';
import { ScrollView, View, StyleSheet, Alert } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '../../store';
import { useStorage } from '../../providers/StorageProvider';
import {
  startEditSession,
  updateEditSet,
  cancelEdit,
  saveEditedSession,
  deleteWorkoutSession,
} from '../../store/slices/workoutSlice';
import ExerciseCard from './ExerciseCard';

interface Props {
  sessionId: string;
  onDone: () => void;
}

export default function EditWorkoutSession({ sessionId, onDone }: Props) {
  const dispatch = useDispatch<AppDispatch>();
  const storage = useStorage();
  const editingSession = useSelector((state: RootState) => state.workout.editingSession);

  useEffect(() => {
    dispatch(startEditSession(sessionId));
  }, [dispatch, sessionId]);

  if (!editingSession) {
    return (
      <View style={styles.loading}>
        <Text variant="bodyMedium" style={{ color: '#888' }}>
          Loading session...
        </Text>
      </View>
    );
  }

  const dateStr = new Date(editingSession.date).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const handleSetUpdate = (
    exerciseIndex: number,
    setIndex: number,
    field: 'reps' | 'weight' | 'completed',
    value: number | boolean,
  ) => {
    dispatch(
      updateEditSet({
        exerciseIndex,
        setIndex,
        ...(field === 'reps' ? { reps: value as number } : {}),
        ...(field === 'weight' ? { weight: value as number } : {}),
        ...(field === 'completed' ? { completed: value as boolean } : {}),
      }),
    );
  };

  const handleSave = async () => {
    await dispatch(saveEditedSession({ storage }));
    onDone();
  };

  const handleDelete = () => {
    Alert.alert('Delete Workout', 'Delete this workout? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await dispatch(deleteWorkoutSession({ storage, sessionId }));
          dispatch(cancelEdit());
          onDone();
        },
      },
    ]);
  };

  const handleCancel = () => {
    dispatch(cancelEdit());
    onDone();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text variant="headlineSmall" style={styles.title}>
        Edit Workout
      </Text>
      <Text variant="bodyMedium" style={styles.date}>
        {dateStr}
      </Text>

      {editingSession.loggedExercises.map((exercise, idx) => (
        <ExerciseCard
          key={exercise.id}
          exercise={exercise}
          exerciseIndex={idx}
          onSetUpdate={handleSetUpdate}
        />
      ))}

      <View style={styles.buttonRow}>
        <Button mode="outlined" onPress={handleCancel} style={styles.button}>
          Cancel
        </Button>
        <Button mode="contained" onPress={handleSave} style={styles.button} buttonColor="#4A90E2">
          Save Changes
        </Button>
      </View>

      <Button
        mode="outlined"
        onPress={handleDelete}
        style={styles.deleteButton}
        textColor="#D32F2F"
      >
        Delete Workout
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 16, paddingBottom: 32 },
  loading: { padding: 24, alignItems: 'center' },
  title: { fontWeight: '700', marginBottom: 4 },
  date: { color: '#888', marginBottom: 16 },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 8,
  },
  button: { flex: 1 },
  deleteButton: { marginTop: 16, borderColor: '#D32F2F' },
});
