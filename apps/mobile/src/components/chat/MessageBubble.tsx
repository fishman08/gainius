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
        body: {
          color: theme.colors.messageBubbleUserText,
          fontSize: 15,
          fontFamily: 'RethinkSans_400Regular',
        },
        paragraph: { marginTop: 0, marginBottom: 4 },
        strong: { fontFamily: 'RethinkSans_700Bold' },
        em: { fontFamily: 'RethinkSans_400Regular', fontStyle: 'italic' },
        code_inline: { fontFamily: 'RethinkSans_500Medium' },
      }),
    [theme],
  );

  const aiMarkdownStyles = useMemo(
    () =>
      StyleSheet.create({
        body: {
          color: theme.colors.messageBubbleAIText,
          fontSize: 15,
          fontFamily: 'RethinkSans_400Regular',
        },
        paragraph: { marginTop: 0, marginBottom: 4 },
        strong: { fontFamily: 'RethinkSans_700Bold' },
        em: { fontFamily: 'RethinkSans_400Regular', fontStyle: 'italic' },
        code_inline: { fontFamily: 'RethinkSans_500Medium' },
      }),
    [theme],
  );

  return (
    <View style={[styles.row, isUser ? styles.rowUser : styles.rowAi]}>
      <View
        style={[
          styles.bubble,
          isUser ? styles.userBubble : styles.aiBubble,
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
  bubble: { maxWidth: '80%', padding: 12 },
  userBubble: { borderRadius: 20 },
  aiBubble: { borderRadius: 20, elevation: 1 },
});
