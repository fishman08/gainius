import { useTheme } from '../../providers/ThemeProvider';

interface ExerciseListSectionProps {
  exercises: string[];
  onSelect: (name: string) => void;
}

export function ExerciseListSection({ exercises, onSelect }: ExerciseListSectionProps) {
  const { theme } = useTheme();

  if (exercises.length === 0) return null;

  return (
    <div
      style={{
        background: theme.colors.surface,
        border: `1px solid ${theme.colors.surfaceBorder}`,
        borderRadius: 12,
        padding: 20,
        marginBottom: 24,
      }}
    >
      <h3 style={{ marginTop: 0, marginBottom: 12, fontSize: 16 }}>Exercises</h3>
      {exercises.map((name) => (
        <div
          key={name}
          onClick={() => onSelect(name)}
          style={{
            padding: '10px 0',
            borderBottom: `1px solid ${theme.colors.background}`,
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ fontWeight: 500, fontSize: 14 }}>{name}</span>
          <span style={{ color: theme.colors.textHint, fontSize: 18 }}>&rsaquo;</span>
        </div>
      ))}
    </div>
  );
}
