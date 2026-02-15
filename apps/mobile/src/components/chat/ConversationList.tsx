import React, { useMemo } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { Card, Text, Button, IconButton } from 'react-native-paper';
import type { Conversation } from '@fitness-tracker/shared';
import { useAppTheme } from '../../providers/ThemeProvider';

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
  const { theme } = useAppTheme();

  const themedStyles = useMemo(
    () => ({
      activeCard: {
        borderColor: theme.colors.primary,
        borderWidth: 2,
      },
      title: { color: theme.colors.text },
      meta: { color: theme.colors.textSecondary },
    }),
    [theme],
  );

  const renderItem = ({ item }: { item: Conversation }) => {
    const isActive = item.id === activeConversationId;
    return (
      <Card
        style={[styles.card, isActive && themedStyles.activeCard]}
        onPress={() => onSelect(item.id)}
      >
        <Card.Content style={styles.cardContent}>
          <View style={styles.cardText}>
            <Text variant="titleSmall" style={themedStyles.title} numberOfLines={1}>
              {item.title || 'Untitled'}
            </Text>
            <Text variant="bodySmall" style={themedStyles.meta}>
              {formatDate(item.lastMessageAt)} · {item.messages.length} messages
            </Text>
          </View>
          {isActive && (
            <IconButton icon="check-circle" size={18} iconColor={theme.colors.primary} />
          )}
        </Card.Content>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <Button mode="contained" onPress={onNewConversation} style={styles.newButton} icon="plus">
        New Conversation
      </Button>
      <FlatList
        data={conversations}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12 },
  newButton: { marginBottom: 12 },
  list: { paddingBottom: 16 },
  card: { marginBottom: 8 },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardText: { flex: 1 },
});
