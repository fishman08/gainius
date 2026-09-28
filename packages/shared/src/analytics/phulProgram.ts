import type { PlannedExercise, WorkoutPlan } from '../types';
import { generateId } from '../utils/id';

export interface ProgramExerciseDef {
  exerciseName: string;
  targetSets: number;
  targetReps: number;
  notes?: string;
}

export interface ProgramDayDef {
  label: string;
  exercises: readonly ProgramExerciseDef[];
}

// PHUL — Power Hypertrophy Upper Lower. 4-day rotation, progressed by the
// consistency engine against each exercise's own targetReps.
export const PHUL_ROTATION: readonly ProgramDayDef[] = [
  {
    label: 'Upper Power',
    exercises: [
      { exerciseName: 'Bench Press', targetSets: 4, targetReps: 5 },
      { exerciseName: 'Chest-Supported Row', targetSets: 4, targetReps: 5 },
      { exerciseName: 'Overhead Press', targetSets: 3, targetReps: 6 },
      {
        exerciseName: 'Pull-ups',
        targetSets: 3,
        targetReps: 8,
        notes: 'Bodyweight — add reps, then load',
      },
      { exerciseName: 'Lateral Raise', targetSets: 3, targetReps: 15 },
      { exerciseName: 'Overhead Cable Tri Ext', targetSets: 3, targetReps: 10 },
      { exerciseName: 'Hammer Curl', targetSets: 3, targetReps: 8 },
    ],
  },
  {
    label: 'Lower Power',
    exercises: [
      { exerciseName: 'Squat', targetSets: 4, targetReps: 5 },
      { exerciseName: 'Romanian Deadlift', targetSets: 3, targetReps: 6 },
      { exerciseName: 'Leg Press', targetSets: 3, targetReps: 10 },
      { exerciseName: 'Hip Thrust', targetSets: 3, targetReps: 8 },
      { exerciseName: 'Seated Leg Curl', targetSets: 3, targetReps: 10 },
      { exerciseName: 'Standing Calf Raise', targetSets: 3, targetReps: 12 },
      { exerciseName: 'Hanging Leg Raise', targetSets: 3, targetReps: 12, notes: 'Bodyweight' },
    ],
  },
  {
    label: 'Upper Hypertrophy',
    exercises: [
      { exerciseName: 'Incline DB Press', targetSets: 4, targetReps: 12 },
      { exerciseName: 'Seated Cable Row', targetSets: 4, targetReps: 12 },
      { exerciseName: 'DB Shoulder Press', targetSets: 3, targetReps: 12 },
      { exerciseName: 'Lateral Raise', targetSets: 4, targetReps: 15 },
      { exerciseName: 'Face Pulls', targetSets: 3, targetReps: 20 },
      { exerciseName: 'Tricep Pushdown', targetSets: 3, targetReps: 12 },
      { exerciseName: 'Incline DB Curl', targetSets: 3, targetReps: 12 },
    ],
  },
  {
    label: 'Lower Hypertrophy',
    exercises: [
      { exerciseName: 'Hip Thrust', targetSets: 4, targetReps: 12 },
      { exerciseName: 'Bulgarian Split Squat', targetSets: 3, targetReps: 10, notes: 'Per leg' },
      { exerciseName: 'Lying Leg Curl', targetSets: 3, targetReps: 12 },
      {
        exerciseName: 'Cable Kickback/Abduction',
        targetSets: 3,
        targetReps: 15,
        notes: 'Per side',
      },
      { exerciseName: 'Seated Calf Raise', targetSets: 3, targetReps: 15 },
      { exerciseName: 'Cable Woodchop', targetSets: 3, targetReps: 12, notes: 'Per side' },
      {
        exerciseName: 'Side Plank',
        targetSets: 3,
        targetReps: 12,
        notes: 'Per side — reps or seconds',
      },
    ],
  },
];

export function buildPhulPlan(
  userId: string,
  today: string = new Date().toISOString().split('T')[0],
): WorkoutPlan {
  const planId = generateId();
  const exercises: PlannedExercise[] = [];
  PHUL_ROTATION.forEach((day, dayIndex) => {
    day.exercises.forEach((ex, order) => {
      exercises.push({
        id: generateId(),
        planId,
        exerciseName: ex.exerciseName,
        targetSets: ex.targetSets,
        targetReps: ex.targetReps,
        dayOfWeek: dayIndex,
        order,
        ...(ex.notes ? { notes: ex.notes } : {}),
      });
    });
  });
  return {
    id: planId,
    userId,
    weekNumber: 1,
    startDate: today,
    endDate: today,
    createdBy: 'manual',
    exercises,
    conversationId: '',
    progressionMode: 'consistency',
    programTemplate: 'phul',
    rotationIndex: 0,
  };
}
