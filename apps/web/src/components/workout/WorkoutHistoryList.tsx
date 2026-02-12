import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import { useTheme } from '../../providers/ThemeProvider';

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
        const exerciseCount = session.loggedExercises.length;
        const volume = session.loggedExercises.reduce(
          (sum, ex) =>
            sum +
            ex.sets.filter((s) => s.completed).reduce((s, set) => s + set.reps * set.weight, 0),
          0,
        );
        const dateStr = new Date(session.date).toLocaleDateString(undefined, {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        });

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
