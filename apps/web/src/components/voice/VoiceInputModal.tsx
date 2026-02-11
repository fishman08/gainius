import { useEffect } from 'react';
import { useVoiceInput } from '../../hooks/useVoiceInput';
import type { ParsedVoiceInput } from '@fitness-tracker/shared';
import { parseVoiceInput } from '@fitness-tracker/shared';

interface VoiceInputModalProps {
  onConfirm: (parsed: ParsedVoiceInput, transcript: string) => void;
  onCancel: () => void;
  mode?: 'workout' | 'chat';
  targetInfo?: string;
}

export function VoiceInputModal({
  onConfirm,
  onCancel,
  mode = 'workout',
  targetInfo,
}: VoiceInputModalProps) {
  const { transcript, isListening, isSupported, error, start, stop } = useVoiceInput();
  const parsed = transcript ? parseVoiceInput(transcript) : null;

  useEffect(() => {
    if (isSupported) {
      start();
    }
  }, []); // eslint-disable-line

  const handleRetry = () => {
    start();
  };

  const handleConfirm = () => {
    if (parsed && transcript) {
      onConfirm(parsed, transcript);
    }
  };

  const handleSendRaw = () => {
    if (transcript) {
      onConfirm({ confidence: 0, raw: transcript }, transcript);
    }
  };

  const showParsedResult = mode === 'workout' && parsed && parsed.confidence > 0;
  const showConfirmButton = mode === 'workout' && parsed && parsed.confidence > 0;
  const showSendButton = mode === 'chat' && !!transcript;
  const showNoNumbersMessage =
    mode === 'workout' && parsed && parsed.confidence === 0 && !!transcript;

  if (!isSupported) {
    return (
      <div style={overlayStyle}>
        <div style={modalStyle}>
          <p style={{ color: '#d32f2f', fontWeight: 600 }}>
            Speech recognition is not supported in this browser.
          </p>
          <p style={{ color: '#666', fontSize: 14 }}>Try using Chrome for voice input.</p>
          <button onClick={onCancel} style={buttonStyle}>
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={overlayStyle}>
      <style>{`@keyframes pulse { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.1); opacity: 0.8; } }`}</style>
      <div style={modalStyle}>
        <h3 style={{ margin: '0 0 8px', fontSize: 18 }}>
          {mode === 'chat' ? 'Voice Message' : 'Voice Input'}
        </h3>
        {targetInfo && mode === 'workout' && (
          <p style={{ margin: '0 0 12px', fontSize: 13, color: '#4A90E2', fontWeight: 600 }}>
            Will update: {targetInfo}
          </p>
        )}

        {isListening && (
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <div style={pulsingMicStyle}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="#d32f2f">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5z" />
                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
              </svg>
            </div>
            <p style={{ color: '#d32f2f', fontWeight: 600, fontSize: 14 }}>Speak now...</p>
            <button
              onClick={stop}
              style={{ ...buttonStyle, background: '#f44336', color: 'white' }}
            >
              Stop
            </button>
          </div>
        )}

        {error && (
          <div style={{ background: '#fef2f2', padding: 12, borderRadius: 8, marginBottom: 12 }}>
            <p style={{ color: '#d32f2f', margin: 0, fontSize: 14 }}>{error}</p>
          </div>
        )}

        {!isListening && transcript && (
          <>
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>You said:</label>
              <p style={transcriptStyle}>"{transcript}"</p>
            </div>

            {showParsedResult && parsed && (
              <div
                style={{ background: '#f0fdf4', padding: 12, borderRadius: 8, marginBottom: 12 }}
              >
                <label style={labelStyle}>Parsed result:</label>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 4 }}>
                  {parsed.name && <span style={chipStyle}>Exercise: {parsed.name}</span>}
                  {parsed.sets != null && <span style={chipStyle}>Sets: {parsed.sets}</span>}
                  {parsed.reps != null && <span style={chipStyle}>Reps: {parsed.reps}</span>}
                  {parsed.weight != null && <span style={chipStyle}>Weight: {parsed.weight}</span>}
                </div>
                <p style={{ margin: '8px 0 0', fontSize: 12, color: '#666' }}>
                  Confidence: {Math.round(parsed.confidence * 100)}%
                </p>
              </div>
            )}

            {showNoNumbersMessage && (
              <div
                style={{ background: '#fffbeb', padding: 12, borderRadius: 8, marginBottom: 12 }}
              >
                <p style={{ color: '#92400e', margin: 0, fontSize: 14 }}>
                  No numbers detected. Try saying something like "10 reps at 135".
                </p>
              </div>
            )}
          </>
        )}

        {!isListening && (
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
            <button onClick={onCancel} style={buttonStyle}>
              Cancel
            </button>
            <button
              onClick={handleRetry}
              style={{ ...buttonStyle, background: '#4A90E2', color: 'white' }}
            >
              {transcript ? 'Retry' : 'Listen Again'}
            </button>
            {showConfirmButton && (
              <button
                onClick={handleConfirm}
                style={{ ...buttonStyle, background: '#4CAF50', color: 'white' }}
              >
                Confirm
              </button>
            )}
            {showSendButton && (
              <button
                onClick={handleSendRaw}
                style={{ ...buttonStyle, background: '#4CAF50', color: 'white' }}
              >
                Send
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

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
  background: 'white',
  borderRadius: 12,
  padding: 24,
  maxWidth: 420,
  width: '90%',
  boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
};

const buttonStyle: React.CSSProperties = {
  padding: '8px 16px',
  border: '1px solid #ddd',
  borderRadius: 6,
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
  background: '#f5f5f5',
};

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: '#888',
  textTransform: 'uppercase',
  letterSpacing: 0.5,
};

const transcriptStyle: React.CSSProperties = {
  fontSize: 16,
  margin: '4px 0 0',
  color: '#333',
  fontStyle: 'italic',
};

const chipStyle: React.CSSProperties = {
  background: '#dcfce7',
  padding: '4px 10px',
  borderRadius: 12,
  fontSize: 13,
  fontWeight: 600,
  color: '#166534',
};

const pulsingMicStyle: React.CSSProperties = {
  width: 64,
  height: 64,
  borderRadius: '50%',
  background: '#fef2f2',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  animation: 'pulse 1.5s ease-in-out infinite',
};
