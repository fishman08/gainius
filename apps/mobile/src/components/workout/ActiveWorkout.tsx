import React, { useState, useMemo } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import { useRestTimer } from '@fitness-tracker/shared';
import type { RootState, AppDispatch } from '../../store';
import { useStorage } from '../../providers/StorageProvider';
import { useAppTheme } from '../../providers/ThemeProvider';
import {
  updateSet,
  endSession,
  saveSession,
  addExerciseToActiveSession,
  addSetToExercise,
  deleteSetFromExercise,
  deleteExerciseFromActiveSession,
  updateExerciseInActiveSession,
} from '../../store/slices/workoutSlice';
import ExerciseCard from './ExerciseCard';
import RestTimer from './RestTimer';
import AddExerciseModal from './AddExerciseModal';

interface Props {
  onComplete: () => void;
}

export default function ActiveWorkout({ onComplete }: Props) {
  const dispatch = useDispatch<AppDispatch>();
  const storage = useStorage();
  const { theme } = useAppTheme();
  const { activeSession, currentPlan } = useSelector((state: RootState) => state.workout);
  const timer = useRestTimer(90);
  const [showAddExercise, setShowAddExercise] = useState(false);

  const themedStyles = useMemo(
    () => ({
      container: {
        flex: 1 as const,
        backgroundColor: theme.colors.background,
      },
    }),
    [theme],
  );

  if (!activeSession) return null;

  const handleSetUpdate = (
    exerciseIndex: number,
    setIndex: number,
    field: 'reps' | 'weight' | 'completed',
    value: number | boolean,
  ) => {
    dispatch(
      updateSet({
        exerciseIndex,
        setIndex,
        ...(field === 'reps' ? { reps: value as number } : {}),
        ...(field === 'weight' ? { weight: value as number } : {}),
        ...(field === 'completed' ? { completed: value as boolean } : {}),
      }),
    );
  };

  const handleAddSet = (exerciseIndex: number) => {
    dispatch(addSetToExercise({ exerciseIndex }));
  };

  const handleAddExercise = (exerciseName: string, notes?: string) => {
    dispatch(addExerciseToActiveSession({ exerciseName, notes }));
    setShowAddExercise(false);
  };

  const handleDeleteSet = (exerciseIndex: number, setIndex: number) => {
    dispatch(deleteSetFromExercise({ exerciseIndex, setIndex }));
  };

  const handleDeleteExercise = (exerciseIndex: number) => {
    dispatch(deleteExerciseFromActiveSession({ exerciseIndex }));
  };

  const handleEditExercise = (exerciseIndex: number, name: string, notes?: string) => {
    dispatch(updateExerciseInActiveSession({ exerciseIndex, name, notes }));
  };

  const handleFinish = async () => {
    dispatch(endSession());
    await dispatch(saveSession({ storage })).unwrap();
    onComplete();
  };

  const planExercises = currentPlan?.exercises ?? [];

  return (
    <ScrollView style={themedStyles.container} contentContainerStyle={styles.content}>
      <RestTimer
        secondsLeft={timer.secondsLeft}
        isRunning={timer.isRunning}
        isPaused={timer.isPaused}
        duration={timer.duration}
        onStart={timer.start}
        onResume={timer.resume}
        onStop={timer.stop}
        onReset={timer.reset}
        onSetDuration={timer.setDuration}
      />

      {activeSession.loggedExercises.map((exercise, index) => {
        const planned = planExercises.find((pe) => pe.id === exercise.plannedExerciseId);
        return (
          <ExerciseCard
            key={exercise.id}
            exercise={exercise}
            exerciseIndex={index}
            plannedExercise={planned}
            onSetUpdate={handleSetUpdate}
            onAddSet={handleAddSet}
            onDeleteSet={handleDeleteSet}
            onDeleteExercise={handleDeleteExercise}
            onEditExercise={handleEditExercise}
          />
        );
      })}

      <Button
        mode="outlined"
        onPress={() => setShowAddExercise(true)}
        style={styles.addExerciseButton}
        icon="plus"
      >
        Add Exercise
      </Button>

      <Button
        mode="contained"
        onPress={handleFinish}
        style={styles.finishButton}
        buttonColor={theme.colors.success}
      >
        Finish Workout
      </Button>

      <AddExerciseModal
        visible={showAddExercise}
        onAdd={handleAddExercise}
        onDismiss={() => setShowAddExercise(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  addExerciseButton: {
    marginTop: 8,
    borderStyle: 'dashed',
  },
  finishButton: {
    marginTop: 12,
  },
});
