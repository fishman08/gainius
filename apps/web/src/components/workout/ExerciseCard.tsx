import type { LoggedExercise, PlannedExercise } from '@fitness-tracker/shared';
import { SetRow } from './SetRow';

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
}

export function ExerciseCard({
  exercise,
  exerciseIndex,
  plannedExercise,
  onSetUpdate,
  onVoiceSet,
}: ExerciseCardProps) {
  const allComplete = exercise.sets.length > 0 && exercise.sets.every((s) => s.completed);

  const targetInfo = plannedExercise
    ? `${plannedExercise.targetSets} x ${plannedExercise.targetReps}` +
      (plannedExercise.suggestedWeight ? ` @ ${plannedExercise.suggestedWeight} lbs` : '')
    : null;

  return (
    <div
      style={{
        background: 'white',
        border: allComplete ? '2px solid #4CAF50' : '1px solid #ddd',
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
        <h3 style={{ margin: 0, fontSize: 17 }}>{exercise.exerciseName}</h3>
        {allComplete && (
          <span
            style={{
              background: '#4CAF50',
              color: 'white',
              fontSize: 12,
              padding: '2px 10px',
              borderRadius: 12,
              fontWeight: 600,
            }}
          >
            Done
          </span>
        )}
      </div>

      {targetInfo && (
        <p style={{ margin: '0 0 12px', fontSize: 13, color: '#888' }}>Target: {targetInfo}</p>
      )}

      {plannedExercise?.notes && (
        <p style={{ margin: '0 0 12px', fontSize: 13, color: '#666', fontStyle: 'italic' }}>
          {plannedExercise.notes}
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
        />
      ))}
    </div>
  );
}
