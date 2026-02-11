import { useEffect, useMemo, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '../../store';
import { useStorage } from '../../providers/StorageProvider';
import { startWorkout, loadHistory } from '../../store/slices/workoutSlice';
import { suggestWeightsForPlan } from '@fitness-tracker/shared';
import { WorkoutHistoryList } from './WorkoutHistoryList';
import { EditWorkoutSession } from './EditWorkoutSession';
import { PlanUpdateBanner } from './PlanUpdateBanner';
import { useUserId } from '../../hooks/useUserId';

export function PlanOverview() {
  const dispatch = useDispatch<AppDispatch>();
  const storage = useStorage();
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
          background: 'white',
          border: '1px solid #ddd',
          borderRadius: 12,
          padding: 24,
          marginBottom: 24,
        }}
      >
        <h2 style={{ marginTop: 0, marginBottom: 16 }}>Week {currentPlan.weekNumber} Plan</h2>

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
                borderBottom: '1px solid #f0f0f0',
              }}
            >
              <span style={{ fontWeight: 500, fontSize: 15 }}>{ex.exerciseName}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: '#666', fontSize: 14 }}>
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
                          ? '#E8F5E9'
                          : suggestion.direction === 'decrease'
                            ? '#FFF3E0'
                            : '#F5F5F5',
                      color:
                        suggestion.direction === 'increase'
                          ? '#2E7D32'
                          : suggestion.direction === 'decrease'
                            ? '#E65100'
                            : '#666',
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
            background: '#4A90E2',
            color: 'white',
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
