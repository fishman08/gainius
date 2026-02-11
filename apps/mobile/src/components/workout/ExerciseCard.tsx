import React from 'react';
import { StyleSheet } from 'react-native';
import { Card, Text } from 'react-native-paper';
import type { LoggedExercise, PlannedExercise } from '@fitness-tracker/shared';
import SetRow from './SetRow';

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
}: Props) {
  const allDone = exercise.sets.length > 0 && exercise.sets.every((s) => s.completed);

  return (
    <Card style={[styles.card, allDone && styles.completedCard]}>
      <Card.Content>
        <Text variant="titleMedium" style={styles.name}>
          {exercise.exerciseName}
        </Text>
        {plannedExercise && (
          <Text variant="bodySmall" style={styles.target}>
            {formatTarget(plannedExercise)}
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
          />
        ))}
        {allDone && (
          <Text variant="labelSmall" style={styles.doneLabel}>
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
  completedCard: {
    borderColor: '#4CAF50',
    borderWidth: 2,
  },
  name: {
    fontWeight: '700',
    marginBottom: 4,
  },
  target: {
    color: '#666',
    marginBottom: 8,
  },
  doneLabel: {
    color: '#4CAF50',
    marginTop: 4,
    textAlign: 'right',
  },
});
