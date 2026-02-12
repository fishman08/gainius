import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '../../store';
import { useStorage } from '../../providers/StorageProvider';
import { useTheme } from '../../providers/ThemeProvider';
import { useRestTimer } from '@fitness-tracker/shared';
import type { ParsedVoiceInput } from '@fitness-tracker/shared';
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
import { ExerciseCard } from './ExerciseCard';
import { RestTimer } from './RestTimer';
import { VoiceInputModal } from '../voice/VoiceInputModal';
import { AddExerciseModal } from './AddExerciseModal';

interface VoiceTarget {
  exerciseIndex: number;
  setIndex: number;
}

interface ActiveWorkoutProps {
  onComplete: () => void;
}

export function ActiveWorkout({ onComplete }: ActiveWorkoutProps) {
  const dispatch = useDispatch<AppDispatch>();
  const storage = useStorage();
  const { theme } = useTheme();
  const { activeSession, currentPlan } = useSelector((state: RootState) => state.workout);
  const timer = useRestTimer(90);
  const [voiceTarget, setVoiceTarget] = useState<VoiceTarget | null>(null);
  const [showAddExercise, setShowAddExercise] = useState(false);

  if (!activeSession) return null;

  const allSetsComplete =
    activeSession.loggedExercises.length > 0 &&
    activeSession.loggedExercises.every((ex) => ex.sets.every((s) => s.completed));

  const findFirstIncompleteSet = (): VoiceTarget | null => {
    for (let ei = 0; ei < activeSession.loggedExercises.length; ei++) {
      const exercise = activeSession.loggedExercises[ei];
      for (let si = 0; si < exercise.sets.length; si++) {
        if (!exercise.sets[si].completed) {
          return { exerciseIndex: ei, setIndex: si };
        }
      }
    }
    return null;
  };

  const computeTargetInfo = (target: VoiceTarget): string | undefined => {
    const exercise = activeSession.loggedExercises[target.exerciseIndex];
    if (!exercise) return undefined;
    return `${exercise.exerciseName} – Set ${target.setIndex + 1}`;
  };

  const targetInfo = voiceTarget ? computeTargetInfo(voiceTarget) : undefined;

  const handleSetUpdate = (
    exerciseIndex: number,
    setIndex: number,
    field: 'reps' | 'weight' | 'completed',
    value: number | boolean,
  ) => {
    dispatch(updateSet({ exerciseIndex, setIndex, [field]: value }));
  };

  const handleVoiceSet = (exerciseIndex: number, setIndex: number) => {
    setVoiceTarget({ exerciseIndex, setIndex });
  };

  const handleHeaderMic = () => {
    const target = findFirstIncompleteSet();
    if (target) setVoiceTarget(target);
  };

  const handleVoiceConfirm = (parsed: ParsedVoiceInput) => {
    if (!voiceTarget) return;
    const { exerciseIndex, setIndex } = voiceTarget;
    if (parsed.reps != null) {
      dispatch(updateSet({ exerciseIndex, setIndex, reps: parsed.reps }));
    }
    if (parsed.weight != null) {
      dispatch(updateSet({ exerciseIndex, setIndex, weight: parsed.weight }));
    }
    setVoiceTarget(null);
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
    await dispatch(saveSession({ storage }));
    onComplete();
  };

  const planExercises = currentPlan?.exercises ?? [];

  return (
    <div style={{ maxWidth: 600, margin: '20px auto', padding: 16 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <h2 style={{ margin: 0, color: theme.colors.text }}>Active Workout</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={handleHeaderMic}
            disabled={allSetsComplete}
            title="Voice input"
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              border: `1px solid ${theme.colors.surfaceBorder}`,
              background: theme.colors.surface,
              cursor: allSetsComplete ? 'default' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: allSetsComplete ? 0.4 : 1,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill={theme.colors.textSecondary}>
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5z" />
              <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
            </svg>
          </button>
          <span style={{ fontSize: 13, color: theme.colors.textHint }}>
            Started {new Date(activeSession.startTime).toLocaleTimeString()}
          </span>
        </div>
      </div>

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
        const planned = planExercises.find((p) => p.id === exercise.plannedExerciseId);
        return (
          <ExerciseCard
            key={exercise.id}
            exercise={exercise}
            exerciseIndex={index}
            plannedExercise={planned}
            onSetUpdate={handleSetUpdate}
            onVoiceSet={handleVoiceSet}
            onAddSet={handleAddSet}
            onDeleteSet={handleDeleteSet}
            onDeleteExercise={handleDeleteExercise}
            onEditExercise={handleEditExercise}
          />
        );
      })}

      <button
        onClick={() => setShowAddExercise(true)}
        style={{
          width: '100%',
          padding: 12,
          background: 'transparent',
          color: theme.colors.primary,
          border: `2px dashed ${theme.colors.primary}`,
          borderRadius: 8,
          fontSize: 15,
          fontWeight: 600,
          cursor: 'pointer',
          marginTop: 4,
          marginBottom: 8,
        }}
      >
        + Add Exercise
      </button>

      <button
        onClick={handleFinish}
        style={{
          width: '100%',
          padding: '14px 0',
          background: theme.colors.success,
          color: theme.colors.primaryText,
          border: 'none',
          borderRadius: 8,
          fontSize: 16,
          fontWeight: 700,
          cursor: 'pointer',
          marginTop: 8,
        }}
      >
        Finish Workout
      </button>

      {showAddExercise && (
        <AddExerciseModal onAdd={handleAddExercise} onCancel={() => setShowAddExercise(false)} />
      )}

      {voiceTarget && (
        <VoiceInputModal
          onConfirm={handleVoiceConfirm}
          onCancel={() => setVoiceTarget(null)}
          mode="workout"
          targetInfo={targetInfo}
        />
      )}
    </div>
  );
}
