import React, { useState, useMemo } from 'react';
import { View, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Text, TextInput, Button, IconButton } from 'react-native-paper';
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
  aiSuggestion?: string;
}

function formatTarget(planned: PlannedExercise): string {
  return `Target: ${planned.targetSets} × ${planned.targetReps} reps`;
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
  aiSuggestion,
}: Props) {
  const { theme } = useAppTheme();
  const allDone = exercise.sets.length > 0 && exercise.sets.every((s) => s.completed);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(exercise.exerciseName);
  const [editNotes, setEditNotes] = useState(exercise.notes ?? '');

  const suggestion =
    aiSuggestion ??
    (plannedExercise?.suggestedWeight ? `${plannedExercise.suggestedWeight} lbs` : null);

  const cardStyle = useMemo(
    () => ({
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.surfaceBorder,
      borderLeftColor: theme.colors.primary,
    }),
    [theme],
  );

  const handleSaveEdit = () => {
    const trimmed = editName.trim();
    if (!trimmed) return;
    onEditExercise?.(exerciseIndex, trimmed, editNotes.trim() || undefined);
    setIsEditing(false);
  };

  const handleDeleteExercise = () => {
    Alert.alert('Delete Exercise', `Delete "${exercise.exerciseName}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => onDeleteExercise?.(exerciseIndex) },
    ]);
  };

  return (
    <View style={[styles.card, cardStyle]}>
      {/* Card header */}
      <View style={styles.header}>
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
            <View style={styles.headerLeft}>
              <Text style={[styles.exerciseName, { color: theme.colors.text }]}>
                {exercise.exerciseName.toUpperCase()}
              </Text>
              {plannedExercise && (
                <Text style={[styles.target, { color: theme.colors.textSecondary }]}>
                  {formatTarget(plannedExercise)}
                </Text>
              )}
              {exercise.notes && !plannedExercise?.notes && (
                <Text
                  style={[
                    styles.target,
                    { color: theme.colors.textSecondary, fontStyle: 'italic' },
                  ]}
                >
                  {exercise.notes}
                </Text>
              )}
            </View>
            <View style={styles.headerRight}>
              {suggestion && (
                <View style={[styles.aiChip, { backgroundColor: theme.colors.primaryMuted }]}>
                  <Text style={[styles.aiChipText, { color: theme.colors.primary }]}>
                    AI: {suggestion}
                  </Text>
                </View>
              )}
              {onEditExercise && (
                <IconButton
                  icon="pencil"
                  size={16}
                  iconColor={theme.colors.textHint}
                  onPress={() => {
                    setEditName(exercise.exerciseName);
                    setEditNotes(exercise.notes ?? '');
                    setIsEditing(true);
                  }}
                />
              )}
              {onDeleteExercise && (
                <IconButton
                  icon="delete-outline"
                  size={16}
                  iconColor={theme.colors.error}
                  onPress={handleDeleteExercise}
                />
              )}
            </View>
          </View>
        )}
      </View>

      {/* Set rows */}
      <View style={styles.sets}>
        {exercise.sets.map((set, setIndex) => (
          <SetRow
            key={set.setNumber}
            setNumber={set.setNumber}
            reps={set.reps}
            weight={set.weight}
            completed={set.completed}
            isActive={!set.completed && setIndex === exercise.sets.findIndex((s) => !s.completed)}
            onRepsChange={(r) => onSetUpdate(exerciseIndex, setIndex, 'reps', r)}
            onWeightChange={(w) => onSetUpdate(exerciseIndex, setIndex, 'weight', w)}
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
      </View>

      {/* Dashed Add Set footer */}
      {onAddSet && (
        <TouchableOpacity
          onPress={() => onAddSet(exerciseIndex)}
          style={[styles.addSetBtn, { borderColor: theme.colors.surfaceElevated }]}
          activeOpacity={0.7}
        >
          <Text style={[styles.addSetText, { color: theme.colors.textSecondary }]}>+ Add Set</Text>
        </TouchableOpacity>
      )}

      {allDone && (
        <Text style={[styles.doneLabel, { color: theme.colors.accent }]}>All sets complete</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderLeftWidth: 4,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 10,
  },
  header: {
    padding: 12,
    paddingBottom: 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginLeft: 8,
  },
  exerciseName: {
    fontFamily: 'BarlowCondensed_700Bold',
    fontSize: 24,
    lineHeight: 24,
    textTransform: 'uppercase',
  },
  target: {
    fontFamily: 'RethinkSans_400Regular',
    fontSize: 11,
    marginTop: 1,
  },
  aiChip: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  aiChipText: {
    fontFamily: 'RethinkSans_600SemiBold',
    fontSize: 11,
  },
  sets: {
    paddingHorizontal: 8,
    paddingBottom: 4,
  },
  addSetBtn: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 8,
    marginHorizontal: 14,
    marginBottom: 8,
    paddingVertical: 7,
    alignItems: 'center',
  },
  addSetText: {
    fontFamily: 'RethinkSans_600SemiBold',
    fontSize: 12,
  },
  doneLabel: {
    fontFamily: 'RethinkSans_600SemiBold',
    fontSize: 11,
    textAlign: 'right',
    paddingHorizontal: 14,
    paddingBottom: 8,
  },
  editContainer: { marginBottom: 8 },
  editInput: { marginBottom: 6 },
  editActions: { flexDirection: 'row', gap: 8 },
});
