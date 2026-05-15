import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import { useTheme } from '../../providers/ThemeProvider';
import type { WorkoutSession } from '@fitness-tracker/shared';

function computeVolume(session: WorkoutSession): number {
  return session.loggedExercises.reduce(
    (sum, ex) =>
      sum + ex.sets.filter((s) => s.completed).reduce((s, set) => s + set.reps * set.weight, 0),
    0,
  );
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (s > 0) return `${m}m ${s}s`;
  return `${m}m`;
}

interface Props {
  onSessionSelect?: (sessionId: string) => void;
}

export function WorkoutHistoryList({ onSessionSelect }: Props) {
  const { theme } = useTheme();
  const { history } = useSelector((state: RootState) => state.workout);

  if (history.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0', color: theme.colors.textHint }}>
        <p>No workout history yet.</p>
      </div>
    );
  }

  return (
    <div>
      <h3 style={{ marginBottom: 12, color: theme.colors.text }}>Workout History</h3>
      {history.map((session) => {
        const isCardio = session.sessionType === 'cardio';
        const dateStr = new Date(session.date).toLocaleDateString(undefined, {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        });

        if (isCardio && session.cardioLog) {
          const { activityType, durationSeconds, distanceMeters } = session.cardioLog;
          const km = distanceMeters ? (distanceMeters / 1000).toFixed(2) : null;
          const paceStr = (() => {
            if (!distanceMeters || !durationSeconds) return null;
            const secsPerKm = durationSeconds / (distanceMeters / 1000);
            const pMin = Math.floor(secsPerKm / 60);
            const pSec = Math.round(secsPerKm % 60);
            return `${pMin}:${String(pSec).padStart(2, '0')} /km`;
          })();

          return (
            <div
              key={session.id}
              onClick={onSessionSelect ? () => onSessionSelect(session.id) : undefined}
              style={{
                background: theme.colors.surface,
                border: `1px solid ${theme.colors.surfaceBorder}`,
                borderRadius: 10,
                padding: '14px 18px',
                marginBottom: 10,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: onSessionSelect ? 'pointer' : undefined,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: theme.colors.primary,
                    textTransform: 'uppercase',
                    marginBottom: 2,
                  }}
                >
                  {activityType.toUpperCase()}
                </div>
                <div style={{ fontWeight: 600, fontSize: 14, color: theme.colors.text }}>
                  {dateStr}
                </div>
                <div style={{ fontSize: 13, color: theme.colors.textHint, marginTop: 2 }}>
                  {formatDuration(durationSeconds)}
                  {km ? ` · ${km} km` : ''}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                {paceStr && (
                  <div style={{ fontWeight: 600, fontSize: 14, color: theme.colors.text }}>
                    {paceStr}
                  </div>
                )}
                <div style={{ fontSize: 12, color: theme.colors.textHint, marginTop: 2 }}>
                  Completed
                </div>
              </div>
            </div>
          );
        }

        const exerciseCount = session.loggedExercises.length;
        const volume = computeVolume(session);

        return (
          <div
            key={session.id}
            onClick={onSessionSelect ? () => onSessionSelect(session.id) : undefined}
            style={{
              background: theme.colors.surface,
              border: `1px solid ${theme.colors.surfaceBorder}`,
              borderRadius: 10,
              padding: '14px 18px',
              marginBottom: 10,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: onSessionSelect ? 'pointer' : undefined,
            }}
          >
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, color: theme.colors.text }}>
                {dateStr}
              </div>
              <div style={{ fontSize: 13, color: theme.colors.textHint, marginTop: 2 }}>
                {exerciseCount} exercise{exerciseCount !== 1 ? 's' : ''}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: theme.colors.text }}>
                {volume.toLocaleString()} lbs
              </div>
              <div style={{ fontSize: 12, color: theme.colors.textHint, marginTop: 2 }}>
                {session.completed ? 'Completed' : 'In Progress'}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
