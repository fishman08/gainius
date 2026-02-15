import React, { useState, useMemo } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Card, Text, Button, IconButton, TextInput } from 'react-native-paper';
import type { LoggedExercise, PlannedExercise } from '@fitness-tracker/shared';
import { useAppTheme } from '../../providers/ThemeProvider';
import SetRow from './SetRow';
import ExercisePicker from './ExercisePicker';

interface Props {
  exercise: LoggedExercise;
  exerciseIndex: number;
  plannedExercise?: PlannedExercise;
  onSetUpdate: (
    exerciseIndex: number,
    setIndex: number,
    field: 'reps' | 'weight' | 'completed',
    value: number | boolean,
  ) => void;
  onAddSet?: (exerciseIndex: number) => void;
  onDeleteSet?: (exerciseIndex: number, setIndex: number) => void;
  onDeleteExercise?: (exerciseIndex: number) => void;
  onEditExercise?: (exerciseIndex: number, name: string, notes?: string) => void;
}

function formatTarget(planned: PlannedExercise): string {
  const base = `Target: ${planned.targetSets}x${planned.targetReps}`;
  if (planned.suggestedWeight) {
    return `${base} @ ${planned.suggestedWeight} lbs`;
  }
  return base;
}

export default function ExerciseCard({
  exercise,
  exerciseIndex,
  plannedExercise,
  onSetUpdate,
  onAddSet,
  onDeleteSet,
  onDeleteExercise,
  onEditExercise,
}: Props) {
  const { theme } = useAppTheme();
  const allDone = exercise.sets.length > 0 && exercise.sets.every((s) => s.completed);

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(exercise.exerciseName);
  const [editNotes, setEditNotes] = useState(exercise.notes ?? '');

  const themedStyles = useMemo(
    () => ({
      completedCard: {
        borderColor: theme.colors.success,
        borderWidth: 2,
      },
      target: {
        color: theme.colors.textSecondary,
        marginBottom: 8,
      },
      doneLabel: {
        color: theme.colors.success,
        marginTop: 4,
        textAlign: 'right' as const,
      },
    }),
    [theme],
  );

  const handleStartEdit = () => {
    setEditName(exercise.exerciseName);
    setEditNotes(exercise.notes ?? '');
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    const trimmed = editName.trim();
    if (!trimmed) return;
    onEditExercise?.(exerciseIndex, trimmed, editNotes.trim() || undefined);
    setIsEditing(false);
  };

  const handleDeleteExercise = () => {
    Alert.alert('Delete Exercise', `Delete "${exercise.exerciseName}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => onDeleteExercise?.(exerciseIndex),
      },
    ]);
  };

  return (
    <Card style={[styles.card, allDone && themedStyles.completedCard]}>
      <Card.Content>
        {isEditing ? (
          <View style={styles.editContainer}>
            <View style={styles.editInput}>
              <ExercisePicker
                value={editName}
                onChangeText={setEditName}
                onSelect={setEditName}
                autoFocus
              />
            </View>
            <TextInput
              mode="outlined"
              dense
              label="Notes (optional)"
              value={editNotes}
              onChangeText={setEditNotes}
              style={styles.editInput}
            />
            <View style={styles.editActions}>
              <Button mode="contained" onPress={handleSaveEdit} compact>
                Save
              </Button>
              <Button mode="outlined" onPress={() => setIsEditing(false)} compact>
                Cancel
              </Button>
            </View>
          </View>
        ) : (
          <View style={styles.headerRow}>
            <Text variant="titleMedium" style={styles.name}>
              {exercise.exerciseName}
            </Text>
            {(onEditExercise || onDeleteExercise) && (
              <View style={styles.headerActions}>
                {onEditExercise && (
                  <IconButton
                    icon="pencil"
                    size={18}
                    iconColor={theme.colors.textHint}
                    onPress={handleStartEdit}
                  />
                )}
                {onDeleteExercise && (
                  <IconButton
                    icon="delete-outline"
                    size={18}
                    iconColor={theme.colors.error}
                    onPress={handleDeleteExercise}
                  />
                )}
              </View>
            )}
          </View>
        )}

        {plannedExercise && (
          <Text variant="bodySmall" style={themedStyles.target}>
            {formatTarget(plannedExercise)}
          </Text>
        )}

        {exercise.notes && !plannedExercise?.notes && (
          <Text variant="bodySmall" style={[themedStyles.target, { fontStyle: 'italic' }]}>
            {exercise.notes}
          </Text>
        )}

        {exercise.sets.map((set, setIndex) => (
          <SetRow
            key={set.setNumber}
            setNumber={set.setNumber}
            reps={set.reps}
            weight={set.weight}
            completed={set.completed}
            onRepsChange={(reps) => onSetUpdate(exerciseIndex, setIndex, 'reps', reps)}
            onWeightChange={(weight) => onSetUpdate(exerciseIndex, setIndex, 'weight', weight)}
            onToggleComplete={() =>
              onSetUpdate(exerciseIndex, setIndex, 'completed', !set.completed)
            }
            onDelete={
              onDeleteSet && exercise.sets.length > 1
                ? () => onDeleteSet(exerciseIndex, setIndex)
                : undefined
            }
          />
        ))}
        {onAddSet && (
          <Button
            mode="outlined"
            onPress={() => onAddSet(exerciseIndex)}
            style={styles.addSetButton}
            compact
            icon="plus"
          >
            Add Set
          </Button>
        )}
        {allDone && (
          <Text variant="labelSmall" style={themedStyles.doneLabel}>
            All sets complete
          </Text>
        )}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
  },
  name: {
    fontWeight: '700',
    marginBottom: 4,
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editContainer: {
    marginBottom: 8,
  },
  editInput: {
    marginBottom: 6,
  },
  editActions: {
    flexDirection: 'row',
    gap: 8,
  },
  addSetButton: {
    marginTop: 8,
    borderStyle: 'dashed',
  },
});
