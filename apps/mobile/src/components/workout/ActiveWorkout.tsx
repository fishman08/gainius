import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { ScrollView, StyleSheet, AppState } from 'react-native';
import { Button } from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import { useRestTimer } from '@fitness-tracker/shared';
import * as Haptics from 'expo-haptics';
import type { RootState, AppDispatch } from '../../store';
import { useStorage } from '../../providers/StorageProvider';
import { useAppTheme } from '../../providers/ThemeProvider';
import {
  requestNotificationPermissions,
  scheduleTimerWarning,
  scheduleTimerComplete,
  cancelTimerNotifications,
} from '../../services/notificationService';
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

  const onTimerWarning = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }, []);

  const onTimerComplete = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    cancelTimerNotifications();
  }, []);

  const timer = useRestTimer({
    defaultSeconds: 90,
    onWarning: onTimerWarning,
    onComplete: onTimerComplete,
  });
  const [showAddExercise, setShowAddExercise] = useState(false);

  const appStateRef = useRef(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (appStateRef.current.match(/inactive|background/) && nextState === 'active') {
        timer.syncFromBackground();
      }
      appStateRef.current = nextState;
    });
    return () => subscription.remove();
  }, [timer.syncFromBackground]);

  const themedStyles = useMemo(
    () => ({
      container: {
        flex: 1 as const,
        backgroundColor: theme.colors.background,
      },
    }),
    [theme],
  );

  const handleTimerStart = useCallback(
    async (seconds?: number) => {
      const d = seconds ?? timer.duration;
      await requestNotificationPermissions();
      scheduleTimerWarning(d);
      scheduleTimerComplete(d);
      timer.start(seconds);
    },
    [timer],
  );

  const handleTimerResume = useCallback(async () => {
    if (timer.secondsLeft > 0) {
      await requestNotificationPermissions();
      scheduleTimerWarning(timer.secondsLeft);
      scheduleTimerComplete(timer.secondsLeft);
    }
    timer.resume();
  }, [timer]);

  const handleTimerStop = useCallback(() => {
    cancelTimerNotifications();
    timer.stop();
  }, [timer]);

  const handleTimerReset = useCallback(() => {
    cancelTimerNotifications();
    timer.reset();
  }, [timer]);

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
        onStart={handleTimerStart}
        onResume={handleTimerResume}
        onStop={handleTimerStop}
        onReset={handleTimerReset}
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
