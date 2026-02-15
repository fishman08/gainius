import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '../../store';
import { useStorage } from '../../providers/StorageProvider';
import { useTheme } from '../../providers/ThemeProvider';
import {
  startEditSession,
  updateEditSet,
  cancelEdit,
  saveEditedSession,
  deleteWorkoutSession,
  loadHistory,
  addExerciseToEditSession,
  addSetToEditExercise,
  deleteSetFromEditExercise,
  deleteExerciseFromEditSession,
  updateExerciseInEditSession,
  updateEditSessionDate,
} from '../../store/slices/workoutSlice';
import { ExerciseCard } from './ExerciseCard';
import { AddExerciseModal } from './AddExerciseModal';

interface Props {
  sessionId: string;
  userId: string;
  onDone: () => void;
}

export function EditWorkoutSession({ sessionId, userId, onDone }: Props) {
  const dispatch = useDispatch<AppDispatch>();
  const storage = useStorage();
  const { theme } = useTheme();
  const editingSession = useSelector((state: RootState) => state.workout.editingSession);

  const [showAddExercise, setShowAddExercise] = useState(false);

  useEffect(() => {
    dispatch(startEditSession(sessionId));
  }, [dispatch, sessionId]);

  if (!editingSession) {
    return <p style={{ textAlign: 'center', color: theme.colors.textHint }}>Loading session...</p>;
  }

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

  const handleAddSet = (exerciseIndex: number) => {
    dispatch(addSetToEditExercise({ exerciseIndex }));
  };

  const handleAddExercise = (exerciseName: string, notes?: string) => {
    dispatch(addExerciseToEditSession({ exerciseName, notes }));
    setShowAddExercise(false);
  };

  const handleDeleteSet = (exerciseIndex: number, setIndex: number) => {
    dispatch(deleteSetFromEditExercise({ exerciseIndex, setIndex }));
  };

  const handleDeleteExercise = (exerciseIndex: number) => {
    dispatch(deleteExerciseFromEditSession({ exerciseIndex }));
  };

  const handleEditExercise = (exerciseIndex: number, name: string, notes?: string) => {
    dispatch(updateExerciseInEditSession({ exerciseIndex, name, notes }));
  };

  const handleSave = async () => {
    await dispatch(saveEditedSession({ storage }));
    dispatch(loadHistory({ storage, userId }));
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
          <h2 style={{ margin: 0, color: theme.colors.text }}>Edit Workout</h2>
          <input
            type="date"
            value={editingSession.date}
            onChange={(e) => dispatch(updateEditSessionDate(e.target.value))}
            style={{
              margin: '4px 0 0',
              padding: '2px 6px',
              fontSize: 14,
              color: theme.colors.textHint,
              background: theme.colors.inputBackground,
              border: `1px solid ${theme.colors.surfaceBorder}`,
              borderRadius: 4,
              cursor: 'pointer',
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={handleCancel}
            style={{
              padding: '8px 16px',
              background: theme.colors.background,
              border: `1px solid ${theme.colors.surfaceBorder}`,
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 14,
              color: theme.colors.text,
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            style={{
              padding: '8px 16px',
              background: theme.colors.primary,
              color: theme.colors.primaryText,
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
          onAddSet={handleAddSet}
          onDeleteSet={handleDeleteSet}
          onDeleteExercise={handleDeleteExercise}
          onEditExercise={handleEditExercise}
        />
      ))}

      <button
        onClick={() => setShowAddExercise(true)}
        style={{
          width: '100%',
          padding: 12,
          background: 'transparent',
          color: theme.colors.primary,
          border: `2px dashed ${theme.colors.primary}`,
          borderRadius: 8,
          fontSize: 15,
          fontWeight: 600,
          cursor: 'pointer',
          marginTop: 4,
          marginBottom: 8,
        }}
      >
        + Add Exercise
      </button>

      {showAddExercise && (
        <AddExerciseModal onAdd={handleAddExercise} onCancel={() => setShowAddExercise(false)} />
      )}

      <button
        onClick={handleDelete}
        style={{
          width: '100%',
          marginTop: 16,
          padding: '10px 16px',
          background: 'transparent',
          color: theme.colors.error,
          border: `1px solid ${theme.colors.error}`,
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
