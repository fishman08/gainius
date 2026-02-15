import { useState } from 'react';
import type { ExtractedExercise } from '@fitness-tracker/shared';
import { useTheme } from '../../providers/ThemeProvider';
import { ExercisePicker } from '../workout/ExercisePicker';

interface Props {
  exercises: ExtractedExercise[];
  onConfirm: (exercises: ExtractedExercise[]) => void;
  onDismiss: () => void;
}

function formatReps(reps: number | string): string {
  return typeof reps === 'number' ? `${reps}` : reps;
}

export default function ExtractedExercisesCard({ exercises, onConfirm, onDismiss }: Props) {
  const { theme } = useTheme();
  const [editableExercises, setEditableExercises] = useState<ExtractedExercise[]>(exercises);

  if (exercises.length === 0) return null;

  const warningBg = theme.mode === 'dark' ? '#3d2e00' : '#FFF3CD';
  const warningBorder = theme.mode === 'dark' ? '#665200' : '#FFE69C';
  const warningText = theme.mode === 'dark' ? '#FFD54F' : '#856404';

  const updateName = (index: number, name: string) => {
    setEditableExercises((prev) => prev.map((ex, i) => (i === index ? { ...ex, name } : ex)));
  };

  return (
    <div
      style={{
        margin: '0 12px 12px',
        padding: 12,
        backgroundColor: warningBg,
        border: `1px solid ${warningBorder}`,
        borderRadius: 8,
      }}
    >
      <h4 style={{ margin: '0 0 8px', fontSize: 14, color: warningText }}>
        Extracted {editableExercises.length} exercise{editableExercises.length > 1 ? 's' : ''}
      </h4>
      {editableExercises.map((ex, i) => (
        <div
          key={i}
          style={{
            padding: 8,
            margin: '4px 0',
            backgroundColor: theme.colors.surface,
            borderRadius: 4,
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <div style={{ flex: 1 }}>
            <ExercisePicker
              value={ex.name}
              onChange={(text) => updateName(i, text)}
              onSelect={(name) => updateName(i, name)}
              placeholder="Exercise name"
            />
          </div>
          <span style={{ color: theme.colors.textSecondary, whiteSpace: 'nowrap', fontSize: 12 }}>
            {ex.sets}x{formatReps(ex.reps)}
            {ex.weight ? ` @ ${ex.weight}` : ''}
          </span>
        </div>
      ))}
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <button
          onClick={() => onConfirm(editableExercises)}
          style={{
            padding: '8px 16px',
            backgroundColor: theme.colors.primary,
            color: theme.colors.primaryText,
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
            color: theme.colors.textSecondary,
            border: `1px solid ${theme.colors.surfaceBorder}`,
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
