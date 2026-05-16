import React, { useState, useCallback } from 'react';
import { View, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import Svg, { Rect, Path } from 'react-native-svg';
import { useAppTheme } from '../../providers/ThemeProvider';

interface Props {
  onSend: (text: string) => void;
  disabled?: boolean;
}

function MicIcon({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Rect x="9" y="2" width="6" height="12" rx="3" stroke={color} strokeWidth={2} />
      <Path
        d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v3"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export default function ChatInput({ onSend, disabled }: Props) {
  const { theme } = useAppTheme();
  const [text, setText] = useState('');

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText('');
  }, [text, onSend]);

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.surfaceBorder },
      ]}
    >
      {/* Mic button */}
      <TouchableOpacity
        style={[styles.micBtn, { backgroundColor: theme.colors.primaryMuted }]}
        activeOpacity={0.7}
        disabled={disabled}
      >
        <MicIcon color={theme.colors.primary} />
      </TouchableOpacity>

      {/* Text input */}
      <TextInput
        value={text}
        onChangeText={setText}
        placeholder="Ask about your workout…"
        placeholderTextColor={theme.colors.textHint}
        style={[
          styles.input,
          {
            backgroundColor: theme.colors.background,
            borderColor: theme.colors.surfaceElevated,
            color: theme.colors.text,
            fontFamily: 'RethinkSans_400Regular',
          },
        ]}
        multiline
        maxLength={2000}
        editable={!disabled}
        returnKeyType="send"
        onSubmitEditing={handleSend}
      />

      {/* Send button */}
      <TouchableOpacity
        onPress={handleSend}
        disabled={disabled || !text.trim()}
        style={[
          styles.sendBtn,
          { backgroundColor: theme.colors.primary, opacity: disabled || !text.trim() ? 0.5 : 1 },
        ]}
        activeOpacity={0.8}
      >
        <Text style={styles.sendText}>SEND</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    paddingBottom: 12,
    borderTopWidth: 1,
  },
  micBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    maxHeight: 100,
  },
  sendBtn: {
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 10,
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  sendText: {
    fontFamily: 'BarlowCondensed_700Bold',
    fontSize: 14,
    letterSpacing: 0.84,
    textTransform: 'uppercase',
    color: '#fff',
  },
});
