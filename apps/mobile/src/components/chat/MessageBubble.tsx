import React from 'react';
import { View, StyleSheet } from 'react-native';
import Markdown from 'react-native-markdown-display';
import type { ChatMessage } from '@fitness-tracker/shared';

interface Props {
  message: ChatMessage;
}

export default function MessageBubble({ message }: Props) {
  const isUser = message.role === 'user';

  return (
    <View style={[styles.row, isUser ? styles.rowUser : styles.rowAi]}>
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAi]}>
        <Markdown style={isUser ? userMarkdownStyles : aiMarkdownStyles}>
          {message.content}
        </Markdown>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { marginBottom: 12, paddingHorizontal: 12 },
  rowUser: { alignItems: 'flex-end' },
  rowAi: { alignItems: 'flex-start' },
  bubble: { maxWidth: '80%', padding: 12, borderRadius: 16 },
  bubbleUser: { backgroundColor: '#4A90E2' },
  bubbleAi: { backgroundColor: '#E8E8E8' },
});

const userMarkdownStyles = StyleSheet.create({
  body: { color: '#fff', fontSize: 15 },
  paragraph: { marginTop: 0, marginBottom: 4 },
});

const aiMarkdownStyles = StyleSheet.create({
  body: { color: '#333', fontSize: 15 },
  paragraph: { marginTop: 0, marginBottom: 4 },
  strong: { fontWeight: '700' as const },
});
