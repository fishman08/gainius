import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, Button, Chip } from 'react-native-paper';
import type { ExtractedExercise } from '@fitness-tracker/shared';
import { useAppTheme } from '../../providers/ThemeProvider';

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

  if (exercises.length === 0) return null;

  const cardBg = theme.mode === 'dark' ? '#3d2e00' : '#FFF3CD';
  const titleColor = theme.mode === 'dark' ? '#FFD54F' : '#856404';

  return (
    <Card style={[styles.card, { backgroundColor: cardBg }]}>
      <Card.Content>
        <Text variant="titleSmall" style={[styles.title, { color: titleColor }]}>
          Extracted {exercises.length} exercise{exercises.length > 1 ? 's' : ''}
        </Text>
        {exercises.map((ex, i) => (
          <Chip
            key={i}
            style={[styles.chip, { backgroundColor: theme.colors.surface }]}
            textStyle={styles.chipText}
          >
            {ex.name} - {ex.sets}x{formatReps(ex.reps)}
            {ex.weight ? ` @ ${ex.weight}` : ''}
          </Chip>
        ))}
        <View style={styles.actions}>
          <Button mode="contained" onPress={() => onConfirm(exercises)} compact>
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
  chip: { marginBottom: 4 },
  chipText: { fontSize: 13 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
});
