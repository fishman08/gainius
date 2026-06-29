import { useEffect, useMemo, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '../../store';
import { useStorage } from '../../providers/StorageProvider';
import { useTheme } from '../../providers/ThemeProvider';
import { startWorkout, loadHistory } from '../../store/slices/workoutSlice';
import { resolveProgressionForPlan } from '@fitness-tracker/shared';
import type { WeightSuggestion, GZCLPSuggestion } from '@fitness-tracker/shared';
import { WorkoutHistoryList } from './WorkoutHistoryList';
import { EditWorkoutSession } from './EditWorkoutSession';
import { PlanUpdateBanner } from './PlanUpdateBanner';
import { useUserId } from '../../hooks/useUserId';

export function PlanOverview() {
  const dispatch = useDispatch<AppDispatch>();
  const storage = useStorage();
  const { theme } = useTheme();
  const userId = useUserId();
  const { currentPlan, history } = useSelector((state: RootState) => state.workout);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);

  const { consistencySuggestions, gzclpSuggestions } = useMemo(() => {
    if (!currentPlan || history.length === 0)
      return {
        consistencySuggestions: [] as WeightSuggestion[],
        gzclpSuggestions: [] as GZCLPSuggestion[],
      };
    const result = resolveProgressionForPlan(currentPlan, history);
    if (result.mode === 'gzclp') {
      return { consistencySuggestions: [], gzclpSuggestions: result.suggestions };
    }
    return { consistencySuggestions: result.suggestions, gzclpSuggestions: [] };
  }, [currentPlan, history]);

  useEffect(() => {
    dispatch(loadHistory({ storage, userId }));
  }, [dispatch, storage, userId]);

  if (editingSessionId) {
    return (
      <div style={{ maxWidth: 600, margin: '20px auto', padding: 16 }}>
        <EditWorkoutSession
          sessionId={editingSessionId}
          userId={userId}
          onDone={() => {
            setEditingSessionId(null);
            dispatch(loadHistory({ storage, userId }));
          }}
        />
      </div>
    );
  }

  if (!currentPlan) return null;

  const handleStart = () => {
    dispatch(startWorkout({ storage, userId }));
  };

  return (
    <div style={{ maxWidth: 600, margin: '20px auto', padding: 16 }}>
      <PlanUpdateBanner />
      <div
        style={{
          background: theme.colors.surface,
          boxShadow: theme.shadows.md,
          borderRadius: theme.borderRadius.md,
          padding: 24,
          marginBottom: 24,
        }}
      >
        <h2
          style={{
            marginTop: 0,
            marginBottom: 16,
            color: theme.colors.text,
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
          }}
        >
          Week {currentPlan.weekNumber} Plan
        </h2>

        {currentPlan.exercises.map((ex) => {
          const cSuggestion = consistencySuggestions.find(
            (s) => s.exerciseName === ex.exerciseName,
          );
          const gSuggestion = gzclpSuggestions.find((s) => s.exerciseName === ex.exerciseName);
          return (
            <div
              key={ex.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 0',
                borderBottom: `1px solid ${theme.colors.surfaceBorder}`,
              }}
            >
              <span style={{ fontWeight: 500, fontSize: 15, color: theme.colors.text }}>
                {ex.exerciseName}
                {ex.tier && (
                  <span style={{ color: theme.colors.textSecondary, fontSize: 12, marginLeft: 6 }}>
                    {ex.tier}
                  </span>
                )}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: theme.colors.textSecondary, fontSize: 14 }}>
                  {ex.targetSets} x {ex.targetReps}
                  {ex.suggestedWeight ? ` @ ${ex.suggestedWeight} lbs` : ''}
                </span>
                {gSuggestion && (
                  <span
                    title={gSuggestion.transitionReason ?? gSuggestion.schemeLabel}
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: 12,
                      background: theme.colors.primaryMuted,
                      color: theme.colors.primary,
                    }}
                  >
                    {gSuggestion.schemeLabel} @ {gSuggestion.suggestedWeight} lbs
                  </span>
                )}
                {cSuggestion && (
                  <span
                    title={cSuggestion.reason}
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: 12,
                      background: theme.colors.primaryMuted,
                      color: theme.colors.primary,
                    }}
                  >
                    AI: {cSuggestion.suggestedWeight} lbs
                  </span>
                )}
              </div>
            </div>
          );
        })}

        <button
          onClick={handleStart}
          style={{
            width: '100%',
            padding: '14px 0',
            background: theme.colors.primary,
            color: theme.colors.primaryText,
            border: 'none',
            borderRadius: theme.borderRadius.sm,
            fontSize: 16,
            fontWeight: 700,
            cursor: 'pointer',
            marginTop: 20,
          }}
        >
          Start Workout
        </button>
      </div>

      <WorkoutHistoryList onSessionSelect={setEditingSessionId} />
    </div>
  );
}
