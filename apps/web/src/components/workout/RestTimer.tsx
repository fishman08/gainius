import { useState } from 'react';

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
    borderRadius: 6,
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
        background: 'white',
        border: '1px solid #ddd',
        borderRadius: 10,
        padding: '12px 20px',
        marginBottom: 20,
      }}
    >
      <span style={{ fontWeight: 600, fontSize: 14, color: '#555' }}>Rest Timer</span>
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
          border: '1px solid #ccc',
          borderRadius: 4,
          fontSize: 13,
          textAlign: 'center',
        }}
      />
      <span style={{ fontSize: 13, color: '#888' }}>sec</span>
      <span style={{ fontSize: 22, fontFamily: 'monospace', fontWeight: 700, minWidth: 70 }}>
        {display}
      </span>
      {isRunning ? (
        <button onClick={onStop} style={{ ...buttonStyle, background: '#f44336', color: 'white' }}>
          Pause
        </button>
      ) : isPaused ? (
        <button
          onClick={onResume}
          style={{ ...buttonStyle, background: '#4CAF50', color: 'white' }}
        >
          Resume
        </button>
      ) : (
        <button
          onClick={() => onStart()}
          style={{ ...buttonStyle, background: '#4A90E2', color: 'white' }}
        >
          Start
        </button>
      )}
      <button onClick={onReset} style={{ ...buttonStyle, background: '#eee', color: '#333' }}>
        Reset
      </button>
    </div>
  );
}
