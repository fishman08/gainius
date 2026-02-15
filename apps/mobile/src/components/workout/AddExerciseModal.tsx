import React, { useState, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Modal, Portal, TextInput, Button, Text } from 'react-native-paper';
import { useAppTheme } from '../../providers/ThemeProvider';
import ExercisePicker from './ExercisePicker';

interface Props {
  visible: boolean;
  onAdd: (exerciseName: string, notes?: string) => void;
  onDismiss: () => void;
}

export default function AddExerciseModal({ visible, onAdd, onDismiss }: Props) {
  const { theme } = useAppTheme();
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');

  const themedStyles = useMemo(
    () => ({
      container: {
        backgroundColor: theme.colors.surface,
        padding: 24,
        margin: 20,
        borderRadius: 12,
      },
    }),
    [theme],
  );

  const handleAdd = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onAdd(trimmed, notes.trim() || undefined);
    setName('');
    setNotes('');
  };

  const handleDismiss = () => {
    setName('');
    setNotes('');
    onDismiss();
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={handleDismiss}
        contentContainerStyle={themedStyles.container}
      >
        <Text variant="titleMedium" style={styles.title}>
          Add Exercise
        </Text>

        <View style={styles.input}>
          <ExercisePicker value={name} onChangeText={setName} onSelect={setName} autoFocus />
        </View>

        <TextInput
          label="Notes (optional)"
          value={notes}
          onChangeText={setNotes}
          mode="outlined"
          multiline
          numberOfLines={2}
          style={styles.input}
        />

        <View style={styles.buttons}>
          <Button mode="outlined" onPress={handleDismiss} style={styles.button}>
            Cancel
          </Button>
          <Button
            mode="contained"
            onPress={handleAdd}
            disabled={!name.trim()}
            style={styles.button}
            buttonColor={theme.colors.primary}
          >
            Add Exercise
          </Button>
        </View>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  title: {
    fontWeight: '700',
    marginBottom: 16,
  },
  input: {
    marginBottom: 12,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 4,
  },
  button: {
    minWidth: 100,
  },
});
