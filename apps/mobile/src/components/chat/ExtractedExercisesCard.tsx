import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, Button } from 'react-native-paper';
import type { ExtractedExercise } from '@fitness-tracker/shared';
import { useAppTheme } from '../../providers/ThemeProvider';
import ExercisePicker from '../workout/ExercisePicker';

interface Props {
  exercises: ExtractedExercise[];
  onConfirm: (exercises: ExtractedExercise[]) => void;
  onDismiss: () => void;
}

function formatReps(reps: number | string): string {
  return typeof reps === 'number' ? `${reps}` : reps;
}

export default function ExtractedExercisesCard({ exercises, onConfirm, onDismiss }: Props) {
  const { theme } = useAppTheme();
  const [editableExercises, setEditableExercises] = useState<ExtractedExercise[]>(exercises);

  if (exercises.length === 0) return null;

  const cardBg = theme.mode === 'dark' ? '#3d2e00' : '#FFF3CD';
  const titleColor = theme.mode === 'dark' ? '#FFD54F' : '#856404';

  const updateName = (index: number, name: string) => {
    setEditableExercises((prev) => prev.map((ex, i) => (i === index ? { ...ex, name } : ex)));
  };

  return (
    <Card style={[styles.card, { backgroundColor: cardBg }]}>
      <Card.Content>
        <Text variant="titleSmall" style={[styles.title, { color: titleColor }]}>
          Extracted {editableExercises.length} exercise{editableExercises.length > 1 ? 's' : ''}
        </Text>
        {editableExercises.map((ex, i) => (
          <View key={i} style={styles.exerciseRow}>
            <View style={styles.pickerContainer}>
              <ExercisePicker
                value={ex.name}
                onChangeText={(text) => updateName(i, text)}
                onSelect={(name) => updateName(i, name)}
                label="Exercise name"
              />
            </View>
            <Text variant="bodySmall" style={{ color: theme.colors.textSecondary }}>
              {ex.sets}x{formatReps(ex.reps)}
              {ex.weight ? ` @ ${ex.weight}` : ''}
            </Text>
          </View>
        ))}
        <View style={styles.actions}>
          <Button mode="contained" onPress={() => onConfirm(editableExercises)} compact>
            Add to Plan
          </Button>
          <Button mode="text" onPress={onDismiss} compact>
            Dismiss
          </Button>
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginHorizontal: 12, marginBottom: 12 },
  title: { marginBottom: 8 },
  exerciseRow: {
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pickerContainer: { flex: 1 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
});
