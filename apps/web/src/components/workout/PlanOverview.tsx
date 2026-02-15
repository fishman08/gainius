import { useEffect, useMemo, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '../../store';
import { useStorage } from '../../providers/StorageProvider';
import { useTheme } from '../../providers/ThemeProvider';
import { startWorkout, loadHistory } from '../../store/slices/workoutSlice';
import { suggestWeightsForPlan } from '@fitness-tracker/shared';
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

  const suggestions = useMemo(() => {
    if (!currentPlan || history.length === 0) return [];
    return suggestWeightsForPlan(history, currentPlan.exercises);
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
          border: `1px solid ${theme.colors.surfaceBorder}`,
          borderRadius: 12,
          padding: 24,
          marginBottom: 24,
        }}
      >
        <h2 style={{ marginTop: 0, marginBottom: 16, color: theme.colors.text }}>
          Week {currentPlan.weekNumber} Plan
        </h2>

        {currentPlan.exercises.map((ex) => {
          const suggestion = suggestions.find((s) => s.exerciseName === ex.exerciseName);
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
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: theme.colors.textSecondary, fontSize: 14 }}>
                  {ex.targetSets} x {ex.targetReps}
                  {ex.suggestedWeight ? ` @ ${ex.suggestedWeight} lbs` : ''}
                </span>
                {suggestion && (
                  <span
                    title={suggestion.reason}
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: 12,
                      background:
                        suggestion.direction === 'increase'
                          ? theme.mode === 'dark'
                            ? '#1b3d1b'
                            : '#E8F5E9'
                          : suggestion.direction === 'decrease'
                            ? theme.mode === 'dark'
                              ? '#3d2e00'
                              : '#FFF3E0'
                            : theme.colors.background,
                      color:
                        suggestion.direction === 'increase'
                          ? theme.mode === 'dark'
                            ? '#66BB6A'
                            : '#2E7D32'
                          : suggestion.direction === 'decrease'
                            ? theme.mode === 'dark'
                              ? '#FFB74D'
                              : '#E65100'
                            : theme.colors.textSecondary,
                    }}
                  >
                    AI: {suggestion.suggestedWeight} lbs
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
            borderRadius: 8,
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
