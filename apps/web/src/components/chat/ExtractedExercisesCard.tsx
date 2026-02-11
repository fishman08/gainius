import type { ExtractedExercise } from '@fitness-tracker/shared';

interface Props {
  exercises: ExtractedExercise[];
  onConfirm: (exercises: ExtractedExercise[]) => void;
  onDismiss: () => void;
}

function formatReps(reps: number | string): string {
  return typeof reps === 'number' ? `${reps}` : reps;
}

export default function ExtractedExercisesCard({ exercises, onConfirm, onDismiss }: Props) {
  if (exercises.length === 0) return null;

  return (
    <div
      style={{
        margin: '0 12px 12px',
        padding: 12,
        backgroundColor: '#FFF3CD',
        border: '1px solid #FFE69C',
        borderRadius: 8,
      }}
    >
      <h4 style={{ margin: '0 0 8px', fontSize: 14, color: '#856404' }}>
        Extracted {exercises.length} exercise{exercises.length > 1 ? 's' : ''}
      </h4>
      {exercises.map((ex, i) => (
        <div
          key={i}
          style={{
            padding: 8,
            margin: '4px 0',
            backgroundColor: '#fff',
            borderRadius: 4,
            fontSize: 13,
          }}
        >
          {ex.name} - {ex.sets}x{formatReps(ex.reps)}
          {ex.weight ? ` @ ${ex.weight}` : ''}
        </div>
      ))}
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <button
          onClick={() => onConfirm(exercises)}
          style={{
            padding: '8px 16px',
            backgroundColor: '#4A90E2',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          Add to Plan
        </button>
        <button
          onClick={onDismiss}
          style={{
            padding: '8px 16px',
            backgroundColor: 'transparent',
            color: '#666',
            border: '1px solid #ccc',
            borderRadius: 6,
            cursor: 'pointer',
          }}
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
