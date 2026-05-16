import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { ScrollView, View, TouchableOpacity, StyleSheet, AppState } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from 'react-native-paper';
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
import { suggestWeightsForPlan } from '@fitness-tracker/shared';

interface Props {
  onComplete: () => void;
}

function useElapsed(startTime: string | undefined): string {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!startTime) return;
    const start = new Date(startTime).getTime();
    const tick = () => setElapsed(Math.floor((Date.now() - start) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startTime]);
  const m = Math.floor(elapsed / 60);
  const s = elapsed % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function ActiveWorkout({ onComplete }: Props) {
  const dispatch = useDispatch<AppDispatch>();
  const storage = useStorage();
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { activeSession, currentPlan } = useSelector((state: RootState) => state.workout);
  const history = useSelector((state: RootState) => state.workout.history);

  const onTimerWarning = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }, []);

  const onTimerComplete = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 200);
    setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 400);
    cancelTimerNotifications();
  }, []);

  const timer = useRestTimer({
    defaultSeconds: 90,
    onWarning: onTimerWarning,
    onComplete: onTimerComplete,
  });
  const [showAddExercise, setShowAddExercise] = useState(false);
  const appStateRef = useRef(AppState.currentState);
  const elapsed = useElapsed(activeSession?.startTime);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (appStateRef.current.match(/inactive|background/) && next === 'active') {
        timer.syncFromBackground();
      }
      appStateRef.current = next;
    });
    return () => sub.remove();
  }, [timer.syncFromBackground]);

  const suggestions = useMemo(() => {
    if (!currentPlan || history.length === 0) return [];
    return suggestWeightsForPlan(history, currentPlan.exercises);
  }, [currentPlan, history]);

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

  const planExercises = currentPlan?.exercises ?? [];

  const totalSets = activeSession.loggedExercises.reduce((acc, ex) => acc + ex.sets.length, 0);
  const completedSets = activeSession.loggedExercises.reduce(
    (acc, ex) => acc + ex.sets.filter((s) => s.completed).length,
    0,
  );
  const progressPct = totalSets > 0 ? completedSets / totalSets : 0;
  const pctLabel = Math.round(progressPct * 100);

  const planName = currentPlan
    ? `${currentPlan.exercises[0]?.exerciseName?.split(' ')[0] ?? 'Workout'} · Day ${currentPlan.weekNumber}`
    : 'Workout';

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

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.colors.background, paddingTop: insets.top },
      ]}
    >
      {/* Progress bar */}
      <View style={[styles.progressTrack, { backgroundColor: theme.colors.surfaceBorder }]}>
        <View
          style={[
            styles.progressFill,
            { backgroundColor: theme.colors.primary, width: `${progressPct * 100}%` },
          ]}
        />
      </View>

      {/* Header row */}
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.planName, { color: theme.colors.text }]}>
            {planName.toUpperCase()}
          </Text>
          <Text style={[styles.planMeta, { color: theme.colors.textSecondary }]}>
            {`${new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}  ·  ${pctLabel}% complete`}
          </Text>
        </View>
        <Text style={[styles.elapsed, { color: theme.colors.primary }]}>{elapsed}</Text>
      </View>

      {/* Compact rest timer */}
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

      {/* Exercise list */}
      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {activeSession.loggedExercises.map((exercise, index) => {
          const planned = planExercises.find((pe) => pe.id === exercise.plannedExerciseId);
          const suggestion = suggestions.find((s) => s.exerciseName === exercise.exerciseName);
          return (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              exerciseIndex={index}
              plannedExercise={planned}
              onSetUpdate={handleSetUpdate}
              onAddSet={(i) => dispatch(addSetToExercise({ exerciseIndex: i }))}
              onDeleteSet={(i, si) =>
                dispatch(deleteSetFromExercise({ exerciseIndex: i, setIndex: si }))
              }
              onDeleteExercise={(i) =>
                dispatch(deleteExerciseFromActiveSession({ exerciseIndex: i }))
              }
              onEditExercise={(i, name, notes) =>
                dispatch(updateExerciseInActiveSession({ exerciseIndex: i, name, notes }))
              }
              aiSuggestion={suggestion ? `${suggestion.suggestedWeight} lbs` : undefined}
            />
          );
        })}

        <TouchableOpacity
          onPress={() => setShowAddExercise(true)}
          style={[styles.addExercise, { borderColor: theme.colors.surfaceElevated }]}
          activeOpacity={0.7}
        >
          <Text style={[styles.addExerciseText, { color: theme.colors.textSecondary }]}>
            + Add Exercise
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleFinish}
          style={[styles.finishBtn, { backgroundColor: theme.colors.success }]}
          activeOpacity={0.85}
        >
          <Text style={[styles.finishText, { color: theme.colors.background }]}>
            FINISH WORKOUT
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <AddExerciseModal
        visible={showAddExercise}
        onAdd={(name, notes) => {
          dispatch(addExerciseToActiveSession({ exerciseName: name, notes }));
          setShowAddExercise(false);
        }}
        onDismiss={() => setShowAddExercise(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  progressTrack: {
    height: 3,
    width: '100%',
  },
  progressFill: {
    height: 3,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  planName: {
    fontFamily: 'BarlowCondensed_700Bold',
    fontSize: 24,
    lineHeight: 24,
    textTransform: 'uppercase',
  },
  planMeta: {
    fontFamily: 'RethinkSans_400Regular',
    fontSize: 11,
    marginTop: 2,
  },
  elapsed: {
    fontFamily: 'monospace',
    fontSize: 18,
    fontVariant: ['tabular-nums'],
    fontWeight: '600',
  },
  list: { flex: 1 },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  addExercise: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    marginBottom: 12,
  },
  addExerciseText: {
    fontFamily: 'RethinkSans_600SemiBold',
    fontSize: 13,
  },
  finishBtn: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  finishText: {
    fontFamily: 'BarlowCondensed_700Bold',
    fontSize: 18,
    letterSpacing: 1.08,
    textTransform: 'uppercase',
  },
});
