import { useState } from 'react';
import { useTheme } from '../../providers/ThemeProvider';

interface RestTimerProps {
  secondsLeft: number;
  isRunning: boolean;
  isPaused: boolean;
  duration: number;
  onStart: (seconds?: number) => void;
  onResume: () => void;
  onStop: () => void;
  onReset: () => void;
  onSetDuration: (seconds: number) => void;
}

export function RestTimer({
  secondsLeft,
  isRunning,
  isPaused,
  duration,
  onStart,
  onResume,
  onStop,
  onReset,
  onSetDuration,
}: RestTimerProps) {
  const { theme } = useTheme();
  const [draftDuration, setDraftDuration] = useState(String(duration));

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const display = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setDraftDuration(val);
    const num = parseInt(val, 10);
    if (!isNaN(num) && num > 0 && num <= 600) {
      onSetDuration(num);
    }
  };

  const buttonStyle: React.CSSProperties = {
    padding: '6px 16px',
    border: 'none',
    borderRadius: theme.borderRadius.sm,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        background: theme.colors.surface,
        boxShadow: theme.shadows.sm,
        borderRadius: theme.borderRadius.md,
        padding: '12px 20px',
        marginBottom: 20,
      }}
    >
      <span style={{ fontWeight: 600, fontSize: 14, color: theme.colors.textSecondary }}>
        Rest Timer
      </span>
      <div style={{ display: 'flex', gap: 4 }}>
        {[
          { label: '30s', value: 30 },
          { label: '60s', value: 60 },
          { label: '90s', value: 90 },
          { label: '2m', value: 120 },
        ].map((preset) => (
          <button
            key={preset.value}
            disabled={isRunning}
            onClick={() => {
              setDraftDuration(String(preset.value));
              onSetDuration(preset.value);
            }}
            style={{
              padding: '4px 8px',
              fontSize: 12,
              borderRadius: theme.borderRadius.sm,
              cursor: isRunning ? 'default' : 'pointer',
              border: `1px solid ${theme.colors.surfaceBorder}`,
              background: duration === preset.value ? theme.colors.primary : theme.colors.surface,
              color: duration === preset.value ? theme.colors.primaryText : theme.colors.text,
              opacity: isRunning ? 0.5 : 1,
            }}
          >
            {preset.label}
          </button>
        ))}
      </div>
      <input
        type="number"
        value={draftDuration}
        onChange={handleDurationChange}
        disabled={isRunning}
        min={1}
        max={600}
        style={{
          width: 60,
          padding: '4px 6px',
          border: `1px solid ${theme.colors.surfaceBorder}`,
          borderRadius: 4,
          fontSize: 13,
          textAlign: 'center',
          background: theme.colors.inputBackground,
          color: theme.colors.text,
        }}
      />
      <span style={{ fontSize: 13, color: theme.colors.textHint }}>sec</span>
      <span
        style={{
          fontSize: 32,
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 700,
          minWidth: 70,
          color: theme.colors.text,
        }}
      >
        {display}
      </span>
      {isRunning ? (
        <button
          onClick={onStop}
          style={{
            ...buttonStyle,
            background: theme.colors.error,
            color: theme.colors.primaryText,
          }}
        >
          Pause
        </button>
      ) : isPaused ? (
        <button
          onClick={onResume}
          style={{
            ...buttonStyle,
            background: theme.colors.success,
            color: theme.colors.primaryText,
          }}
        >
          Resume
        </button>
      ) : (
        <button
          onClick={() => onStart()}
          style={{
            ...buttonStyle,
            background: theme.colors.primary,
            color: theme.colors.primaryText,
          }}
        >
          Start
        </button>
      )}
      <button
        onClick={onReset}
        style={{ ...buttonStyle, background: theme.colors.background, color: theme.colors.text }}
      >
        Reset
      </button>
    </div>
  );
}
