import { useState } from 'react';
import { useTheme } from '../../providers/ThemeProvider';

interface AddExerciseModalProps {
  onAdd: (exerciseName: string, notes?: string) => void;
  onCancel: () => void;
}

export function AddExerciseModal({ onAdd, onCancel }: AddExerciseModalProps) {
  const { theme } = useTheme();
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onAdd(trimmed, notes.trim() || undefined);
  };

  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  };

  const modalStyle: React.CSSProperties = {
    background: theme.colors.surface,
    borderRadius: 12,
    padding: 24,
    maxWidth: 420,
    width: '90%',
    boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
  };

  const buttonBaseStyle: React.CSSProperties = {
    padding: '8px 16px',
    border: `1px solid ${theme.colors.surfaceBorder}`,
    borderRadius: 6,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    background: theme.colors.background,
    color: theme.colors.text,
  };

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <h3 style={{ margin: '0 0 16px', fontSize: 18, color: theme.colors.text }}>Add Exercise</h3>

        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Exercise name"
          autoFocus
          style={{
            width: '100%',
            padding: 12,
            border: `1px solid ${theme.colors.surfaceBorder}`,
            borderRadius: 8,
            fontSize: 16,
            marginBottom: 12,
            boxSizing: 'border-box' as const,
            background: theme.colors.inputBackground,
            color: theme.colors.text,
          }}
        />

        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notes (optional)"
          rows={2}
          style={{
            width: '100%',
            padding: 12,
            border: `1px solid ${theme.colors.surfaceBorder}`,
            borderRadius: 8,
            fontSize: 14,
            marginBottom: 16,
            boxSizing: 'border-box' as const,
            resize: 'vertical',
            fontFamily: 'inherit',
            background: theme.colors.inputBackground,
            color: theme.colors.text,
          }}
        />

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={buttonBaseStyle}>
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!name.trim()}
            style={{
              ...buttonBaseStyle,
              background: theme.colors.primary,
              color: theme.colors.primaryText,
              border: 'none',
              opacity: !name.trim() ? 0.5 : 1,
            }}
          >
            Add Exercise
          </button>
        </div>
      </div>
    </div>
  );
}
