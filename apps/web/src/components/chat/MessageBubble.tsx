import ReactMarkdown from 'react-markdown';
import type { ChatMessage } from '@fitness-tracker/shared';

interface Props {
  message: ChatMessage;
}

export default function MessageBubble({ message }: Props) {
  const isUser = message.role === 'user';

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        marginBottom: 12,
        paddingInline: 12,
      }}
    >
      <div
        style={{
          maxWidth: '80%',
          padding: '12px 16px',
          borderRadius: 16,
          backgroundColor: isUser ? '#4A90E2' : '#E8E8E8',
          color: isUser ? '#fff' : '#333',
          fontSize: 15,
          lineHeight: 1.5,
        }}
      >
        {isUser ? (
          <p style={{ margin: 0 }}>{message.content}</p>
        ) : (
          <ReactMarkdown>{message.content}</ReactMarkdown>
        )}
      </div>
    </div>
  );
}
