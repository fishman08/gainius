import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../../store';
import { clearActiveSession } from '../../store/slices/workoutSlice';

interface WorkoutSummaryProps {
  onDone: () => void;
}

export function WorkoutSummary({ onDone }: WorkoutSummaryProps) {
  const dispatch = useDispatch();
  const { history, currentPlan } = useSelector((state: RootState) => state.workout);
  const session = history[0];

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
      <h2 style={{ textAlign: 'center', color: '#4CAF50' }}>Workout Complete!</h2>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-around',
          background: 'white',
          border: '1px solid #ddd',
          borderRadius: 12,
          padding: 20,
          marginBottom: 20,
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 700 }}>{durationMin}</div>
          <div style={{ fontSize: 13, color: '#888' }}>minutes</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 700 }}>{exercisesDone}</div>
          <div style={{ fontSize: 13, color: '#888' }}>exercises</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 700 }}>{totalVolume.toLocaleString()}</div>
          <div style={{ fontSize: 13, color: '#888' }}>lbs volume</div>
        </div>
      </div>

      <div style={{ background: 'white', border: '1px solid #ddd', borderRadius: 12, padding: 20 }}>
        <h3 style={{ marginTop: 0, marginBottom: 16 }}>Exercise Details</h3>
        {session.loggedExercises.map((ex) => {
          const planned = planExercises.find((p) => p.id === ex.plannedExerciseId);
          const completedSets = ex.sets.filter((s) => s.completed);
          return (
            <div
              key={ex.id}
              style={{ marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid #eee' }}
            >
              <div style={{ fontWeight: 600, marginBottom: 4 }}>{ex.exerciseName}</div>
              <div style={{ fontSize: 13, color: '#555' }}>
                Completed: {completedSets.length} / {ex.sets.length} sets
                {planned && (
                  <span style={{ marginLeft: 12, color: '#888' }}>
                    Target: {planned.targetSets} x {planned.targetReps}
                  </span>
                )}
              </div>
              {completedSets.length > 0 && (
                <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
                  {completedSets.map((s) => `${s.reps}x${s.weight}lbs`).join(', ')}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <button
        onClick={handleDone}
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
        Done
      </button>
    </div>
  );
}
