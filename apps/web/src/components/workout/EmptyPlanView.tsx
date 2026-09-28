import { useDispatch } from 'react-redux';
import type { AppDispatch } from '../../store';
import { useStorage } from '../../providers/StorageProvider';
import { useTheme } from '../../providers/ThemeProvider';
import { seedGzclpPlan, seedPhulPlan } from '../../store/slices/workoutSlice';
import { useUserId } from '../../hooks/useUserId';
import { PresetProgramCard } from './PresetProgramCard';

export function EmptyPlanView() {
  const dispatch = useDispatch<AppDispatch>();
  const storage = useStorage();
  const userId = useUserId();
  const { theme } = useTheme();

  const handleStartGzclp = () => {
    dispatch(seedGzclpPlan({ storage, userId }));
  };

  const handleStartPhul = () => {
    dispatch(seedPhulPlan({ storage, userId }));
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
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          width: '100%',
          alignItems: 'center',
        }}
      >
        <PresetProgramCard
          title="GZCLP Linear Progression"
          description="A proven beginner strength program. 4-session rotation (A1/B1/A2/B2) with automatic T1/T2/T3 tier progression. Weights start at 45 lbs — update them in your first session."
          actionLabel="Start GZCLP Program"
          onStart={handleStartGzclp}
        />
        <PresetProgramCard
          title="PHUL — Power Hypertrophy Upper Lower"
          description="4-day split: heavy 4–6 rep power days, then 10–15 rep hypertrophy days. Weight goes up once you hit your target reps on every set. Enter your starting weights in your first session."
          actionLabel="Start PHUL Program"
          onStart={handleStartPhul}
        />
      </div>
    </div>
  );
}
