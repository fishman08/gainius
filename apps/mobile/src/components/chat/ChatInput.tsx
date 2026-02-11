import React, { useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, IconButton } from 'react-native-paper';

interface Props {
  onSend: (text: string) => void;
  disabled?: boolean;
}

export default function ChatInput({ onSend, disabled }: Props) {
  const [text, setText] = useState('');

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText('');
  }, [text, onSend]);

  return (
    <View style={styles.container}>
      <TextInput
        value={text}
        onChangeText={setText}
        placeholder="Ask about your workout..."
        mode="outlined"
        style={styles.input}
        dense
        multiline
        maxLength={2000}
        disabled={disabled}
        onSubmitEditing={handleSend}
        returnKeyType="send"
      />
      <IconButton
        icon="send"
        mode="contained"
        onPress={handleSend}
        disabled={disabled || !text.trim()}
        size={24}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    backgroundColor: '#fff',
  },
  input: { flex: 1, marginRight: 4, maxHeight: 100 },
});
