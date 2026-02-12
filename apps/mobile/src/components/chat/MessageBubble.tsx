import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Markdown from 'react-native-markdown-display';
import type { ChatMessage } from '@fitness-tracker/shared';
import { useAppTheme } from '../../providers/ThemeProvider';

interface Props {
  message: ChatMessage;
}

export default function MessageBubble({ message }: Props) {
  const { theme } = useAppTheme();
  const isUser = message.role === 'user';

  const userMarkdownStyles = useMemo(
    () =>
      StyleSheet.create({
        body: { color: theme.colors.messageBubbleUserText, fontSize: 15 },
        paragraph: { marginTop: 0, marginBottom: 4 },
      }),
    [theme],
  );

  const aiMarkdownStyles = useMemo(
    () =>
      StyleSheet.create({
        body: { color: theme.colors.messageBubbleAIText, fontSize: 15 },
        paragraph: { marginTop: 0, marginBottom: 4 },
        strong: { fontWeight: '700' as const },
      }),
    [theme],
  );

  return (
    <View style={[styles.row, isUser ? styles.rowUser : styles.rowAi]}>
      <View
        style={[
          styles.bubble,
          {
            backgroundColor: isUser ? theme.colors.messageBubbleUser : theme.colors.messageBubbleAI,
          },
        ]}
      >
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
});
