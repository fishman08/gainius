import { useTheme } from '../../providers/ThemeProvider';

interface SetRowProps {
  setNumber: number;
  reps: number;
  weight: number;
  completed: boolean;
  onRepsChange: (reps: number) => void;
  onWeightChange: (weight: number) => void;
  onToggleComplete: () => void;
  onVoiceInput?: () => void;
  onDelete?: () => void;
}

export function SetRow({
  setNumber,
  reps,
  weight,
  completed,
  onRepsChange,
  onWeightChange,
  onToggleComplete,
  onVoiceInput,
  onDelete,
}: SetRowProps) {
  const { theme } = useTheme();

  const rowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '8px 12px',
    borderRadius: 6,
    background: completed
      ? theme.mode === 'dark'
        ? '#1b3d1b'
        : '#E8F5E9'
      : theme.colors.background,
    marginBottom: 6,
  };

  const inputStyle: React.CSSProperties = {
    width: 60,
    padding: '6px 8px',
    border: `1px solid ${theme.colors.surfaceBorder}`,
    borderRadius: 4,
    fontSize: 14,
    textAlign: 'center',
    background: theme.colors.inputBackground,
    color: theme.colors.text,
  };

  return (
    <div style={rowStyle}>
      <span style={{ fontWeight: 600, minWidth: 50, fontSize: 14, color: theme.colors.text }}>
        Set {setNumber}
      </span>
      <label style={{ fontSize: 13, color: theme.colors.textSecondary }}>
        Reps
        <input
          type="number"
          min={0}
          value={reps}
          onChange={(e) => onRepsChange(Number(e.target.value))}
          style={{ ...inputStyle, marginLeft: 4 }}
        />
      </label>
      <label style={{ fontSize: 13, color: theme.colors.textSecondary }}>
        Weight
        <input
          type="number"
          min={0}
          value={weight}
          onChange={(e) => onWeightChange(Number(e.target.value))}
          style={{ ...inputStyle, marginLeft: 4 }}
        />
      </label>
      {onVoiceInput && (
        <button
          onClick={onVoiceInput}
          title="Voice input for this set"
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: completed ? 0.3 : 0.7,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill={theme.colors.textSecondary}>
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5z" />
            <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
          </svg>
        </button>
      )}
      <button
        onClick={onToggleComplete}
        style={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          border: completed
            ? `2px solid ${theme.colors.success}`
            : `2px solid ${theme.colors.surfaceBorder}`,
          background: completed ? theme.colors.success : theme.colors.surface,
          color: completed ? theme.colors.primaryText : theme.colors.surfaceBorder,
          fontSize: 16,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {'\u2713'}
      </button>
      {onDelete && (
        <button
          onClick={onDelete}
          title="Delete set"
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: theme.colors.textHint,
            fontSize: 16,
          }}
        >
          {'\u00d7'}
        </button>
      )}
    </div>
  );
}
