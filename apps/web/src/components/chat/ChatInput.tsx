import { useState, useCallback } from 'react';
import { VoiceInputModal } from '../voice/VoiceInputModal';

interface Props {
  onSend: (text: string) => void;
  disabled?: boolean;
}

export default function ChatInput({ onSend, disabled }: Props) {
  const [text, setText] = useState('');
  const [showVoice, setShowVoice] = useState(false);

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText('');
  }, [text, onSend]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  const handleVoiceConfirm = (_parsed: unknown, transcript: string) => {
    onSend(transcript);
    setShowVoice(false);
  };

  return (
    <>
      <div
        style={{
          display: 'flex',
          gap: 8,
          padding: 12,
          borderTop: '1px solid #ddd',
          backgroundColor: '#fff',
        }}
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about your workout..."
          disabled={disabled}
          maxLength={2000}
          style={{
            flex: 1,
            padding: '12px 16px',
            border: '1px solid #ddd',
            borderRadius: 20,
            fontSize: 16,
            outline: 'none',
          }}
        />
        <button
          onClick={() => setShowVoice(true)}
          disabled={disabled}
          title="Voice input"
          style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            border: '1px solid #ddd',
            background: 'white',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: disabled ? 0.5 : 1,
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#666">
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5z" />
            <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
          </svg>
        </button>
        <button
          onClick={handleSend}
          disabled={disabled || !text.trim()}
          style={{
            padding: '12px 20px',
            backgroundColor: '#4A90E2',
            color: '#fff',
            border: 'none',
            borderRadius: 20,
            fontWeight: 600,
            cursor: 'pointer',
            opacity: disabled || !text.trim() ? 0.5 : 1,
          }}
        >
          Send
        </button>
      </div>
      {showVoice && (
        <VoiceInputModal
          onConfirm={handleVoiceConfirm}
          onCancel={() => setShowVoice(false)}
          mode="chat"
        />
      )}
    </>
  );
}
