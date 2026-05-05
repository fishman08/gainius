import { useSelector, useDispatch } from 'react-redux';
import ReactMarkdown from 'react-markdown';
import type { RootState, AppDispatch } from '../../store';
import { clearActiveSession } from '../../store/slices/workoutSlice';
import { requestSessionReview, clearSessionReview } from '../../store/slices/chatSlice';
import { useTheme } from '../../providers/ThemeProvider';
import { useAuth } from '../../providers/AuthProvider';
import { useStorage } from '../../providers/StorageProvider';
import { useState, useEffect } from 'react';
import type { User } from '@fitness-tracker/shared';

interface WorkoutSummaryProps {
  onDone: () => void;
}

export function WorkoutSummary({ onDone }: WorkoutSummaryProps) {
  const dispatch = useDispatch<AppDispatch>();
  const { theme } = useTheme();
  const { history, currentPlan } = useSelector((state: RootState) => state.workout);
  const { sessionReview, sessionReviewLoading } = useSelector((state: RootState) => state.chat);
  const { user: authUser } = useAuth();
  const storage = useStorage();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const session = history[0];

  useEffect(() => {
    if (authUser?.id) {
      storage.getUser(authUser.id).then(setCurrentUser);
    }
  }, [authUser, storage]);

  useEffect(() => {
    return () => {
      dispatch(clearSessionReview());
    };
  }, [dispatch]);

  if (!session) return null;

  const startTime = new Date(session.startTime);
  const endTime = session.endTime ? new Date(session.endTime) : null;
  const durationMin = endTime ? Math.round((endTime.getTime() - startTime.getTime()) / 60000) : 0;

  const exercisesDone = session.loggedExercises.filter((ex) =>
    ex.sets.some((s) => s.completed),
  ).length;

  const totalVolume = session.loggedExercises.reduce(
    (sum, ex) =>
      sum + ex.sets.filter((s) => s.completed).reduce((s, set) => s + set.reps * set.weight, 0),
    0,
  );

  const planExercises = currentPlan?.exercises ?? [];

  const handleDone = () => {
    dispatch(clearActiveSession());
    onDone();
  };

  return (
    <div style={{ maxWidth: 600, margin: '20px auto', padding: 16 }}>
      <h2
        style={{
          textAlign: 'center',
          color: theme.colors.accent,
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 700,
        }}
      >
        Workout Complete!
      </h2>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-around',
          background: theme.colors.surface,
          boxShadow: theme.shadows.md,
          borderRadius: theme.borderRadius.md,
          padding: 20,
          marginBottom: 20,
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: theme.colors.text,
              fontFamily: "'Barlow Condensed', sans-serif",
            }}
          >
            {durationMin}
          </div>
          <div style={{ fontSize: 13, color: theme.colors.textHint }}>minutes</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: theme.colors.text,
              fontFamily: "'Barlow Condensed', sans-serif",
            }}
          >
            {exercisesDone}
          </div>
          <div style={{ fontSize: 13, color: theme.colors.textHint }}>exercises</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: theme.colors.text,
              fontFamily: "'Barlow Condensed', sans-serif",
            }}
          >
            {totalVolume.toLocaleString()}
          </div>
          <div style={{ fontSize: 13, color: theme.colors.textHint }}>lbs volume</div>
        </div>
      </div>

      <div
        style={{
          background: theme.colors.surface,
          boxShadow: theme.shadows.sm,
          borderRadius: theme.borderRadius.md,
          padding: 20,
        }}
      >
        <h3
          style={{
            marginTop: 0,
            marginBottom: 16,
            color: theme.colors.text,
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 600,
          }}
        >
          Exercise Details
        </h3>
        {session.loggedExercises.map((ex) => {
          const planned = planExercises.find((p) => p.id === ex.plannedExerciseId);
          const completedSets = ex.sets.filter((s) => s.completed);
          return (
            <div
              key={ex.id}
              style={{
                marginBottom: 12,
                paddingBottom: 12,
                borderBottom: `1px solid ${theme.colors.surfaceBorder}`,
              }}
            >
              <div style={{ fontWeight: 600, marginBottom: 4, color: theme.colors.text }}>
                {ex.exerciseName}
              </div>
              <div style={{ fontSize: 13, color: theme.colors.textSecondary }}>
                Completed: {completedSets.length} / {ex.sets.length} sets
                {planned && (
                  <span style={{ marginLeft: 12, color: theme.colors.textHint }}>
                    Target: {planned.targetSets} x {planned.targetReps}
                  </span>
                )}
              </div>
              {completedSets.length > 0 && (
                <div style={{ fontSize: 12, color: theme.colors.textHint, marginTop: 4 }}>
                  {completedSets.map((s) => `${s.reps}x${s.weight}lbs`).join(', ')}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <button
        onClick={() =>
          dispatch(
            requestSessionReview({
              session,
              plan: currentPlan,
              user: currentUser,
              weightUnit: currentUser?.preferences?.weightUnit ?? 'lbs',
            }),
          )
        }
        disabled={sessionReviewLoading || !!sessionReview}
        style={{
          width: '100%',
          padding: '12px 0',
          background: 'transparent',
          color: theme.colors.primary,
          border: `1px solid ${theme.colors.primary}`,
          borderRadius: theme.borderRadius.sm,
          fontSize: 15,
          fontWeight: 600,
          cursor: sessionReviewLoading || sessionReview ? 'default' : 'pointer',
          marginTop: 16,
          opacity: sessionReviewLoading ? 0.6 : 1,
        }}
      >
        {sessionReviewLoading ? 'Analyzing...' : sessionReview ? 'AI Review' : 'Get AI Review'}
      </button>

      {sessionReview && (
        <div
          style={{
            background: theme.colors.surface,
            boxShadow: theme.shadows.sm,
            borderRadius: theme.borderRadius.md,
            padding: 16,
            marginTop: 12,
            fontSize: 14,
            lineHeight: 1.6,
            color: theme.colors.text,
          }}
        >
          <ReactMarkdown>{sessionReview}</ReactMarkdown>
        </div>
      )}

      <button
        onClick={handleDone}
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
        Done
      </button>
    </div>
  );
}
