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
          borderRadius: theme.borderRadius.lg,
          ...(isUser
            ? {
                background: `linear-gradient(135deg, ${theme.colors.gradient1}, ${theme.colors.gradient2})`,
                color: '#ffffff',
              }
            : {
                backgroundColor: theme.colors.messageBubbleAI,
                color: theme.colors.messageBubbleAIText,
                boxShadow: theme.shadows.sm,
              }),
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
