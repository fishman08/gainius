import { useMemo } from 'react';
import type { WorkoutSession } from '@fitness-tracker/shared';
import { computeExerciseAnalytics } from '@fitness-tracker/shared';
import { ExerciseProgressChart } from './ExerciseProgressChart';

interface ExerciseDetailViewProps {
  exerciseName: string;
  sessions: WorkoutSession[];
  onBack: () => void;
}

export function ExerciseDetailView({ exerciseName, sessions, onBack }: ExerciseDetailViewProps) {
  const analytics = useMemo(
    () => computeExerciseAnalytics(sessions, exerciseName),
    [sessions, exerciseName],
  );

  return (
    <div>
      <button
        onClick={onBack}
        style={{
          background: 'none',
          border: 'none',
          color: '#4A90E2',
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
          background: 'white',
          border: '1px solid #e0e0e0',
          borderRadius: 12,
          padding: 20,
        }}
      >
        <h3 style={{ marginTop: 0, marginBottom: 12, fontSize: 16 }}>Recent Sets</h3>
        {analytics.dataPoints.length === 0 ? (
          <p style={{ color: '#999' }}>No logged sets yet</p>
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
                  borderBottom: '1px solid #f5f5f5',
                  fontSize: 14,
                }}
              >
                <span style={{ color: '#888' }}>{dp.date}</span>
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

const statBoxStyle: React.CSSProperties = {
  background: 'white',
  border: '1px solid #e0e0e0',
  borderRadius: 10,
  padding: '14px 8px',
  textAlign: 'center',
};

const statValueStyle: React.CSSProperties = {
  fontSize: 22,
  fontWeight: 700,
  color: '#333',
};

const statLabelStyle: React.CSSProperties = {
  fontSize: 12,
  color: '#888',
  marginTop: 4,
};
