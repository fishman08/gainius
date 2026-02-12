import React, { useEffect, useState, useMemo } from 'react';
import { ScrollView, View, StyleSheet, Alert } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '../../store';
import { useStorage } from '../../providers/StorageProvider';
import { useAppTheme } from '../../providers/ThemeProvider';
import {
  startEditSession,
  updateEditSet,
  cancelEdit,
  saveEditedSession,
  deleteWorkoutSession,
  addExerciseToEditSession,
  addSetToEditExercise,
  deleteSetFromEditExercise,
  deleteExerciseFromEditSession,
  updateExerciseInEditSession,
} from '../../store/slices/workoutSlice';
import ExerciseCard from './ExerciseCard';
import AddExerciseModal from './AddExerciseModal';

interface Props {
  sessionId: string;
  onDone: () => void;
}

export default function EditWorkoutSession({ sessionId, onDone }: Props) {
  const dispatch = useDispatch<AppDispatch>();
  const storage = useStorage();
  const { theme } = useAppTheme();
  const editingSession = useSelector((state: RootState) => state.workout.editingSession);

  const [showAddExercise, setShowAddExercise] = useState(false);

  const themedStyles = useMemo(
    () => ({
      container: {
        flex: 1 as const,
        backgroundColor: theme.colors.background,
      },
      date: {
        color: theme.colors.textHint,
        marginBottom: 16,
      },
      deleteButton: {
        marginTop: 16,
        borderColor: theme.colors.error,
      },
    }),
    [theme],
  );

  useEffect(() => {
    dispatch(startEditSession(sessionId));
  }, [dispatch, sessionId]);

  if (!editingSession) {
    return (
      <View style={styles.loading}>
        <Text variant="bodyMedium" style={{ color: theme.colors.textHint }}>
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

  const handleAddSet = (exerciseIndex: number) => {
    dispatch(addSetToEditExercise({ exerciseIndex }));
  };

  const handleAddExercise = (exerciseName: string, notes?: string) => {
    dispatch(addExerciseToEditSession({ exerciseName, notes }));
    setShowAddExercise(false);
  };

  const handleDeleteSet = (exerciseIndex: number, setIndex: number) => {
    dispatch(deleteSetFromEditExercise({ exerciseIndex, setIndex }));
  };

  const handleDeleteExercise = (exerciseIndex: number) => {
    dispatch(deleteExerciseFromEditSession({ exerciseIndex }));
  };

  const handleEditExercise = (exerciseIndex: number, name: string, notes?: string) => {
    dispatch(updateExerciseInEditSession({ exerciseIndex, name, notes }));
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
    <ScrollView style={themedStyles.container} contentContainerStyle={styles.content}>
      <Text variant="headlineSmall" style={styles.title}>
        Edit Workout
      </Text>
      <Text variant="bodyMedium" style={themedStyles.date}>
        {dateStr}
      </Text>

      {editingSession.loggedExercises.map((exercise, idx) => (
        <ExerciseCard
          key={exercise.id}
          exercise={exercise}
          exerciseIndex={idx}
          onSetUpdate={handleSetUpdate}
          onAddSet={handleAddSet}
          onDeleteSet={handleDeleteSet}
          onDeleteExercise={handleDeleteExercise}
          onEditExercise={handleEditExercise}
        />
      ))}

      <Button
        mode="outlined"
        onPress={() => setShowAddExercise(true)}
        style={styles.addExerciseButton}
        icon="plus"
      >
        Add Exercise
      </Button>

      <AddExerciseModal
        visible={showAddExercise}
        onAdd={handleAddExercise}
        onDismiss={() => setShowAddExercise(false)}
      />

      <View style={styles.buttonRow}>
        <Button mode="outlined" onPress={handleCancel} style={styles.button}>
          Cancel
        </Button>
        <Button
          mode="contained"
          onPress={handleSave}
          style={styles.button}
          buttonColor={theme.colors.primary}
        >
          Save Changes
        </Button>
      </View>

      <Button
        mode="outlined"
        onPress={handleDelete}
        style={themedStyles.deleteButton}
        textColor={theme.colors.error}
      >
        Delete Workout
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 32 },
  loading: { padding: 24, alignItems: 'center' },
  title: { fontWeight: '700', marginBottom: 4 },
  addExerciseButton: {
    marginTop: 8,
    marginBottom: 8,
    borderStyle: 'dashed',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 8,
  },
  button: { flex: 1 },
});
