import type { Conversation } from '@fitness-tracker/shared';
import { useTheme } from '../../providers/ThemeProvider';

interface Props {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelect: (conversationId: string) => void;
  onNewConversation: () => void;
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function ConversationList({
  conversations,
  activeConversationId,
  onSelect,
  onNewConversation,
}: Props) {
  const { theme } = useTheme();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <button
        onClick={onNewConversation}
        style={{
          margin: '0 12px 12px',
          padding: '10px 16px',
          background: theme.colors.primary,
          color: theme.colors.primaryText,
          border: 'none',
          borderRadius: 8,
          fontSize: 14,
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        + New Conversation
      </button>
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px' }}>
        {conversations.map((convo) => {
          const isActive = convo.id === activeConversationId;
          return (
            <div
              key={convo.id}
              onClick={() => onSelect(convo.id)}
              style={{
                padding: '12px 14px',
                marginBottom: 6,
                background: isActive ? theme.colors.surface : theme.colors.surface,
                border: isActive
                  ? `2px solid ${theme.colors.primary}`
                  : `1px solid ${theme.colors.surfaceBorder}`,
                borderRadius: 8,
                cursor: 'pointer',
              }}
            >
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: theme.colors.text,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {convo.title || 'Untitled'}
              </div>
              <div style={{ fontSize: 12, color: theme.colors.textSecondary, marginTop: 4 }}>
                {formatDate(convo.lastMessageAt)} · {convo.messages.length} messages
              </div>
            </div>
          );
        })}
        {conversations.length === 0 && (
          <p style={{ textAlign: 'center', color: theme.colors.textHint, fontSize: 13 }}>
            No conversations yet
          </p>
        )}
      </div>
    </div>
  );
}
