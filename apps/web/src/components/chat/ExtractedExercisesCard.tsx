import type { ExtractedExercise } from '@fitness-tracker/shared';
import { useTheme } from '../../providers/ThemeProvider';

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

  if (exercises.length === 0) return null;

  const warningBg = theme.mode === 'dark' ? '#3d2e00' : '#FFF3CD';
  const warningBorder = theme.mode === 'dark' ? '#665200' : '#FFE69C';
  const warningText = theme.mode === 'dark' ? '#FFD54F' : '#856404';

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
        Extracted {exercises.length} exercise{exercises.length > 1 ? 's' : ''}
      </h4>
      {exercises.map((ex, i) => (
        <div
          key={i}
          style={{
            padding: 8,
            margin: '4px 0',
            backgroundColor: theme.colors.surface,
            borderRadius: 4,
            fontSize: 13,
            color: theme.colors.text,
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
