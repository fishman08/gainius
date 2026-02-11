import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '../../store';
import { useStorage } from '../../providers/StorageProvider';
import {
  startEditSession,
  updateEditSet,
  cancelEdit,
  saveEditedSession,
  deleteWorkoutSession,
} from '../../store/slices/workoutSlice';
import { ExerciseCard } from './ExerciseCard';

interface Props {
  sessionId: string;
  onDone: () => void;
}

export function EditWorkoutSession({ sessionId, onDone }: Props) {
  const dispatch = useDispatch<AppDispatch>();
  const storage = useStorage();
  const editingSession = useSelector((state: RootState) => state.workout.editingSession);

  useEffect(() => {
    dispatch(startEditSession(sessionId));
  }, [dispatch, sessionId]);

  if (!editingSession) {
    return <p style={{ textAlign: 'center', color: '#888' }}>Loading session...</p>;
  }

  const dateStr = new Date(editingSession.date).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const handleSetUpdate = (
    exerciseIndex: number,
    setIndex: number,
    field: 'reps' | 'weight' | 'completed',
    value: number | boolean,
  ) => {
    dispatch(
      updateEditSet({
        exerciseIndex,
        setIndex,
        ...(field === 'reps' ? { reps: value as number } : {}),
        ...(field === 'weight' ? { weight: value as number } : {}),
        ...(field === 'completed' ? { completed: value as boolean } : {}),
      }),
    );
  };

  const handleSave = async () => {
    await dispatch(saveEditedSession({ storage }));
    onDone();
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this workout? This cannot be undone.')) return;
    await dispatch(deleteWorkoutSession({ storage, sessionId }));
    dispatch(cancelEdit());
    onDone();
  };

  const handleCancel = () => {
    dispatch(cancelEdit());
    onDone();
  };

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20,
        }}
      >
        <div>
          <h2 style={{ margin: 0 }}>Edit Workout</h2>
          <p style={{ margin: '4px 0 0', color: '#888', fontSize: 14 }}>{dateStr}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={handleCancel}
            style={{
              padding: '8px 16px',
              background: '#f5f5f5',
              border: '1px solid #ddd',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            style={{
              padding: '8px 16px',
              background: '#4A90E2',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            Save Changes
          </button>
        </div>
      </div>

      {editingSession.loggedExercises.map((exercise, idx) => (
        <ExerciseCard
          key={exercise.id}
          exercise={exercise}
          exerciseIndex={idx}
          onSetUpdate={handleSetUpdate}
        />
      ))}

      <button
        onClick={handleDelete}
        style={{
          width: '100%',
          marginTop: 16,
          padding: '10px 16px',
          background: 'transparent',
          color: '#D32F2F',
          border: '1px solid #D32F2F',
          borderRadius: 6,
          cursor: 'pointer',
          fontSize: 14,
          fontWeight: 600,
        }}
      >
        Delete Workout
      </button>
    </div>
  );
}
