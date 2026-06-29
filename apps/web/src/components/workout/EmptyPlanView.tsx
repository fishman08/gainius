import { useDispatch } from 'react-redux';
import type { AppDispatch } from '../../store';
import { useStorage } from '../../providers/StorageProvider';
import { useTheme } from '../../providers/ThemeProvider';
import { seedGzclpPlan } from '../../store/slices/workoutSlice';
import { useUserId } from '../../hooks/useUserId';

export function EmptyPlanView() {
  const dispatch = useDispatch<AppDispatch>();
  const storage = useStorage();
  const userId = useUserId();
  const { theme } = useTheme();

  const handleStartGzclp = () => {
    dispatch(seedGzclpPlan({ storage, userId }));
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 120,
        padding: '120px 24px 0',
      }}
    >
      <h1 style={{ color: theme.colors.primary, fontSize: 24, margin: 0 }}>No workout plan yet</h1>
      <p
        style={{
          color: theme.colors.textSecondary,
          marginTop: 12,
          fontSize: 15,
          textAlign: 'center',
        }}
      >
        Chat with your AI coach to create a personalized workout plan.
      </p>

      <div
        style={{
          marginTop: 40,
          width: '100%',
          maxWidth: 400,
          background: theme.colors.surface,
          border: `1px solid ${theme.colors.surfaceBorder}`,
          borderRadius: theme.borderRadius.md,
          padding: 20,
        }}
      >
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: theme.colors.textSecondary,
            textTransform: 'uppercase',
            letterSpacing: 1,
            marginBottom: 8,
          }}
        >
          Or start a preset program
        </div>
        <div style={{ fontSize: 15, fontWeight: 600, color: theme.colors.text, marginBottom: 4 }}>
          GZCLP Linear Progression
        </div>
        <div
          style={{
            fontSize: 13,
            color: theme.colors.textSecondary,
            marginBottom: 16,
            lineHeight: 1.5,
          }}
        >
          A proven beginner strength program. 4-session rotation (A1/B1/A2/B2) with automatic
          T1/T2/T3 tier progression. Weights start at 45 lbs — update them in your first session.
        </div>
        <button
          onClick={handleStartGzclp}
          style={{
            width: '100%',
            padding: '12px 0',
            background: theme.colors.primary,
            color: theme.colors.primaryText,
            border: 'none',
            borderRadius: theme.borderRadius.sm,
            fontSize: 15,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Start GZCLP Program
        </button>
      </div>
    </div>
  );
}
