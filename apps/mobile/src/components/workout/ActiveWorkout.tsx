import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import { useRestTimer } from '@fitness-tracker/shared';
import type { RootState, AppDispatch } from '../../store';
import { useStorage } from '../../providers/StorageProvider';
import { updateSet, endSession, saveSession } from '../../store/slices/workoutSlice';
import ExerciseCard from './ExerciseCard';
import RestTimer from './RestTimer';

interface Props {
  onComplete: () => void;
}

export default function ActiveWorkout({ onComplete }: Props) {
  const dispatch = useDispatch<AppDispatch>();
  const storage = useStorage();
  const { activeSession, currentPlan } = useSelector((state: RootState) => state.workout);
  const timer = useRestTimer(90);

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

  const handleFinish = async () => {
    dispatch(endSession());
    await dispatch(saveSession({ storage })).unwrap();
    onComplete();
  };

  const planExercises = currentPlan?.exercises ?? [];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
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
          />
        );
      })}

      <Button
        mode="contained"
        onPress={handleFinish}
        style={styles.finishButton}
        buttonColor="#4CAF50"
      >
        Finish Workout
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  finishButton: {
    marginTop: 16,
  },
});
