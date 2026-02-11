import React, { useRef, useEffect } from 'react';
import { FlatList, StyleSheet } from 'react-native';
import type { ChatMessage } from '@fitness-tracker/shared';
import MessageBubble from './MessageBubble';

interface Props {
  messages: ChatMessage[];
}

export default function MessageList({ messages }: Props) {
  const listRef = useRef<FlatList<ChatMessage>>(null);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  return (
    <FlatList
      ref={listRef}
      data={messages}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <MessageBubble message={item} />}
      style={styles.list}
      contentContainerStyle={styles.content}
      keyboardDismissMode="on-drag"
      keyboardShouldPersistTaps="handled"
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1 },
  content: { paddingVertical: 12 },
});
