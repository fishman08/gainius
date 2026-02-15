import { useState } from 'react';
import type { LoggedExercise, PlannedExercise } from '@fitness-tracker/shared';
import { SetRow } from './SetRow';
import { ExercisePicker } from './ExercisePicker';
import { useTheme } from '../../providers/ThemeProvider';

interface ExerciseCardProps {
  exercise: LoggedExercise;
  exerciseIndex: number;
  plannedExercise?: PlannedExercise;
  onSetUpdate: (
    exerciseIndex: number,
    setIndex: number,
    field: 'reps' | 'weight' | 'completed',
    value: number | boolean,
  ) => void;
  onVoiceSet?: (exerciseIndex: number, setIndex: number) => void;
  onAddSet?: (exerciseIndex: number) => void;
  onDeleteSet?: (exerciseIndex: number, setIndex: number) => void;
  onDeleteExercise?: (exerciseIndex: number) => void;
  onEditExercise?: (exerciseIndex: number, name: string, notes?: string) => void;
}

export function ExerciseCard({
  exercise,
  exerciseIndex,
  plannedExercise,
  onSetUpdate,
  onVoiceSet,
  onAddSet,
  onDeleteSet,
  onDeleteExercise,
  onEditExercise,
}: ExerciseCardProps) {
  const { theme } = useTheme();
  const allComplete = exercise.sets.length > 0 && exercise.sets.every((s) => s.completed);

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(exercise.exerciseName);
  const [editNotes, setEditNotes] = useState(exercise.notes ?? '');

  const targetInfo = plannedExercise
    ? `${plannedExercise.targetSets} x ${plannedExercise.targetReps}` +
      (plannedExercise.suggestedWeight ? ` @ ${plannedExercise.suggestedWeight} lbs` : '')
    : null;

  const handleStartEdit = () => {
    setEditName(exercise.exerciseName);
    setEditNotes(exercise.notes ?? '');
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    const trimmed = editName.trim();
    if (!trimmed) return;
    onEditExercise?.(exerciseIndex, trimmed, editNotes.trim() || undefined);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleDeleteExercise = () => {
    if (!window.confirm(`Delete "${exercise.exerciseName}"?`)) return;
    onDeleteExercise?.(exerciseIndex);
  };

  return (
    <div
      style={{
        background: theme.colors.surface,
        border: allComplete
          ? `2px solid ${theme.colors.success}`
          : `1px solid ${theme.colors.surfaceBorder}`,
        borderRadius: 12,
        padding: 20,
        marginBottom: 16,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
        }}
      >
        {isEditing ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <ExercisePicker
              value={editName}
              onChange={setEditName}
              onSelect={setEditName}
              autoFocus
            />
            <input
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              placeholder="Notes (optional)"
              style={{
                fontSize: 13,
                padding: '4px 8px',
                border: `1px solid ${theme.colors.surfaceBorder}`,
                borderRadius: 4,
                background: theme.colors.inputBackground,
                color: theme.colors.text,
              }}
            />
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                onClick={handleSaveEdit}
                style={{
                  padding: '4px 12px',
                  fontSize: 12,
                  fontWeight: 600,
                  background: theme.colors.primary,
                  color: theme.colors.primaryText,
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer',
                }}
              >
                Save
              </button>
              <button
                onClick={handleCancelEdit}
                style={{
                  padding: '4px 12px',
                  fontSize: 12,
                  background: 'transparent',
                  color: theme.colors.textSecondary,
                  border: `1px solid ${theme.colors.surfaceBorder}`,
                  borderRadius: 4,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h3 style={{ margin: 0, fontSize: 17, color: theme.colors.text }}>
                {exercise.exerciseName}
              </h3>
              {(onEditExercise || onDeleteExercise) && (
                <div style={{ display: 'flex', gap: 2 }}>
                  {onEditExercise && (
                    <button
                      onClick={handleStartEdit}
                      title="Edit exercise"
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: '50%',
                        border: 'none',
                        background: 'transparent',
                        cursor: 'pointer',
                        color: theme.colors.textHint,
                        fontSize: 14,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {'\u270E'}
                    </button>
                  )}
                  {onDeleteExercise && (
                    <button
                      onClick={handleDeleteExercise}
                      title="Delete exercise"
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: '50%',
                        border: 'none',
                        background: 'transparent',
                        cursor: 'pointer',
                        color: theme.colors.error,
                        fontSize: 14,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {'\u2715'}
                    </button>
                  )}
                </div>
              )}
            </div>
            {allComplete && (
              <span
                style={{
                  background: theme.colors.success,
                  color: theme.colors.primaryText,
                  fontSize: 12,
                  padding: '2px 10px',
                  borderRadius: 12,
                  fontWeight: 600,
                }}
              >
                Done
              </span>
            )}
          </>
        )}
      </div>

      {targetInfo && (
        <p style={{ margin: '0 0 12px', fontSize: 13, color: theme.colors.textHint }}>
          Target: {targetInfo}
        </p>
      )}

      {plannedExercise?.notes && (
        <p
          style={{
            margin: '0 0 12px',
            fontSize: 13,
            color: theme.colors.textSecondary,
            fontStyle: 'italic',
          }}
        >
          {plannedExercise.notes}
        </p>
      )}

      {exercise.notes && !plannedExercise?.notes && (
        <p
          style={{
            margin: '0 0 12px',
            fontSize: 13,
            color: theme.colors.textSecondary,
            fontStyle: 'italic',
          }}
        >
          {exercise.notes}
        </p>
      )}

      {exercise.sets.map((set, setIndex) => (
        <SetRow
          key={set.setNumber}
          setNumber={set.setNumber}
          reps={set.reps}
          weight={set.weight}
          completed={set.completed}
          onRepsChange={(reps) => onSetUpdate(exerciseIndex, setIndex, 'reps', reps)}
          onWeightChange={(weight) => onSetUpdate(exerciseIndex, setIndex, 'weight', weight)}
          onToggleComplete={() => onSetUpdate(exerciseIndex, setIndex, 'completed', !set.completed)}
          onVoiceInput={onVoiceSet ? () => onVoiceSet(exerciseIndex, setIndex) : undefined}
          onDelete={
            onDeleteSet && exercise.sets.length > 1
              ? () => onDeleteSet(exerciseIndex, setIndex)
              : undefined
          }
        />
      ))}

      {onAddSet && (
        <button
          onClick={() => onAddSet(exerciseIndex)}
          style={{
            width: '100%',
            padding: 8,
            marginTop: 8,
            background: 'transparent',
            color: theme.colors.primary,
            border: `1px dashed ${theme.colors.primary}`,
            borderRadius: 6,
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          + Add Set
        </button>
      )}
    </div>
  );
}
