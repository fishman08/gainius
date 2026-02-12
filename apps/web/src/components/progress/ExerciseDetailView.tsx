import { useMemo } from 'react';
import type { WorkoutSession } from '@fitness-tracker/shared';
import { computeExerciseAnalytics } from '@fitness-tracker/shared';
import { ExerciseProgressChart } from './ExerciseProgressChart';
import { useTheme } from '../../providers/ThemeProvider';

interface ExerciseDetailViewProps {
  exerciseName: string;
  sessions: WorkoutSession[];
  onBack: () => void;
}

export function ExerciseDetailView({ exerciseName, sessions, onBack }: ExerciseDetailViewProps) {
  const { theme } = useTheme();

  const analytics = useMemo(
    () => computeExerciseAnalytics(sessions, exerciseName),
    [sessions, exerciseName],
  );

  const statBoxStyle: React.CSSProperties = {
    background: theme.colors.surface,
    border: `1px solid ${theme.colors.surfaceBorder}`,
    borderRadius: 10,
    padding: '14px 8px',
    textAlign: 'center',
  };

  const statValueStyle: React.CSSProperties = {
    fontSize: 22,
    fontWeight: 700,
    color: theme.colors.text,
  };

  const statLabelStyle: React.CSSProperties = {
    fontSize: 12,
    color: theme.colors.textHint,
    marginTop: 4,
  };

  return (
    <div>
      <button
        onClick={onBack}
        style={{
          background: 'none',
          border: 'none',
          color: theme.colors.primary,
          cursor: 'pointer',
          fontSize: 14,
          fontWeight: 600,
          padding: '8px 0',
          marginBottom: 12,
        }}
      >
        &larr; Back to overview
      </button>

      <h2 style={{ marginTop: 0, marginBottom: 20 }}>{exerciseName}</h2>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 12,
          marginBottom: 24,
        }}
      >
        <div style={statBoxStyle}>
          <div style={statValueStyle}>{analytics.bestWeight} lbs</div>
          <div style={statLabelStyle}>Best Weight</div>
        </div>
        <div style={statBoxStyle}>
          <div style={statValueStyle}>{analytics.avgWeight} lbs</div>
          <div style={statLabelStyle}>Avg Weight</div>
        </div>
        <div style={statBoxStyle}>
          <div style={statValueStyle}>{analytics.sessionCount}</div>
          <div style={statLabelStyle}>Sessions</div>
        </div>
      </div>

      <ExerciseProgressChart analytics={analytics} />

      <div
        style={{
          background: theme.colors.surface,
          border: `1px solid ${theme.colors.surfaceBorder}`,
          borderRadius: 12,
          padding: 20,
        }}
      >
        <h3 style={{ marginTop: 0, marginBottom: 12, fontSize: 16 }}>Recent Sets</h3>
        {analytics.dataPoints.length === 0 ? (
          <p style={{ color: theme.colors.textHint }}>No logged sets yet</p>
        ) : (
          analytics.dataPoints
            .slice(-20)
            .reverse()
            .map((dp, i) => (
              <div
                key={`${dp.date}-${i}`}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '6px 0',
                  borderBottom: `1px solid ${theme.colors.background}`,
                  fontSize: 14,
                }}
              >
                <span style={{ color: theme.colors.textHint }}>{dp.date}</span>
                <span>
                  {dp.weight} lbs x {dp.reps} reps
                </span>
              </div>
            ))
        )}
      </div>
    </div>
  );
}
