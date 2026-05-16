import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import Markdown from 'react-native-markdown-display';
import type { ChatMessage } from '@fitness-tracker/shared';
import { useAppTheme } from '../../providers/ThemeProvider';

interface Props {
  message: ChatMessage;
}

export default function MessageBubble({ message }: Props) {
  const { theme } = useAppTheme();
  const isUser = message.role === 'user';

  const aiMarkdownStyles = useMemo(
    () =>
      StyleSheet.create({
        body: {
          color: theme.colors.text,
          fontSize: 14,
          fontFamily: 'RethinkSans_400Regular',
          lineHeight: 20,
        },
        paragraph: { marginTop: 0, marginBottom: 4 },
        strong: { fontFamily: 'RethinkSans_700Bold', color: theme.colors.primary },
        em: { fontFamily: 'RethinkSans_400Regular', fontStyle: 'italic' },
        code_inline: { fontFamily: 'RethinkSans_500Medium' },
      }),
    [theme],
  );

  const userMarkdownStyles = useMemo(
    () =>
      StyleSheet.create({
        body: {
          color: '#fff',
          fontSize: 14,
          fontFamily: 'RethinkSans_400Regular',
          lineHeight: 20,
        },
        paragraph: { marginTop: 0, marginBottom: 4 },
        strong: { fontFamily: 'RethinkSans_700Bold' },
        em: { fontFamily: 'RethinkSans_400Regular', fontStyle: 'italic' },
        code_inline: { fontFamily: 'RethinkSans_500Medium' },
      }),
    [],
  );

  if (isUser) {
    return (
      <View style={styles.userRow}>
        <View style={styles.userBubble}>
          <Markdown style={userMarkdownStyles}>{message.content}</Markdown>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.aiRow}>
      {/* Small AI avatar */}
      <View style={[styles.avatar, { backgroundColor: theme.colors.primary }]}>
        <Text style={styles.avatarText}>AI</Text>
      </View>
      <View
        style={[
          styles.aiBubble,
          { backgroundColor: theme.colors.surface, borderColor: theme.colors.surfaceBorder },
        ]}
      >
        <Markdown style={aiMarkdownStyles}>{message.content}</Markdown>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  aiRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 14,
    paddingHorizontal: 16,
  },
  userRow: {
    alignItems: 'flex-end',
    marginBottom: 14,
    paddingHorizontal: 16,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    flexShrink: 0,
  },
  avatarText: {
    fontFamily: 'BarlowCondensed_700Bold',
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  aiBubble: {
    maxWidth: '80%',
    borderRadius: 0,
    borderTopRightRadius: 14,
    borderBottomRightRadius: 14,
    borderBottomLeftRadius: 14,
    padding: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
  },
  userBubble: {
    maxWidth: '75%',
    borderRadius: 14,
    borderTopRightRadius: 0,
    padding: 10,
    paddingHorizontal: 14,
    backgroundColor: '#F97316',
    // gradient fallback — orange to dark-orange
  },
});
