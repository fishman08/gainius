import { Check, X, Mic } from 'lucide-react';
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
    background: completed ? theme.colors.primaryMuted : theme.colors.background,
    marginBottom: 6,
  };

  const inputStyle: React.CSSProperties = {
    width: 60,
    padding: '6px 8px',
    border: `1px solid ${theme.colors.surfaceBorder}`,
    borderRadius: theme.borderRadius.sm,
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
            color: theme.colors.textSecondary,
          }}
        >
          <Mic size={14} />
        </button>
      )}
      <button
        onClick={onToggleComplete}
        style={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          border: completed
            ? `2px solid ${theme.colors.accent}`
            : `2px solid ${theme.colors.surfaceBorder}`,
          background: completed ? theme.colors.accent : theme.colors.surface,
          color: completed ? theme.colors.primaryText : theme.colors.surfaceBorder,
          fontSize: 16,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Check size={16} />
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
          <X size={14} />
        </button>
      )}
    </div>
  );
}
