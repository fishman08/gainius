import ReactMarkdown from 'react-markdown';
import type { ChatMessage } from '@fitness-tracker/shared';
import { useTheme } from '../../providers/ThemeProvider';

interface Props {
  message: ChatMessage;
}

export default function MessageBubble({ message }: Props) {
  const { theme } = useTheme();
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
          backgroundColor: isUser ? theme.colors.messageBubbleUser : theme.colors.messageBubbleAI,
          color: isUser ? theme.colors.messageBubbleUserText : theme.colors.messageBubbleAIText,
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
