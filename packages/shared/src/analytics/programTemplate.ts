import type { PlannedExercise, WorkoutPlan } from '../types';
import { GZCLP_ROTATION } from './gzclpProgression';
import { PHUL_ROTATION } from './phulProgram';

function rotationFor(plan: WorkoutPlan): readonly { label: string }[] | null {
  if (plan.programTemplate === 'phul') return PHUL_ROTATION;
  if (plan.programTemplate === 'gzclp' || plan.progressionMode === 'gzclp') return GZCLP_ROTATION;
  return null;
}

/** True for preset programs that cycle through fixed days via `rotationIndex`. */
export function isRotationPlan(plan: WorkoutPlan): boolean {
  return rotationFor(plan) !== null;
}

/** Exercises served in the next session: the current rotation day, or the whole plan. */
export function getSessionExercises(plan: WorkoutPlan): PlannedExercise[] {
  if (!isRotationPlan(plan)) return plan.exercises;
  const index = plan.rotationIndex ?? 0;
  return plan.exercises.filter((ex) => ex.dayOfWeek === index);
}

/** Rotation index after completing a session; wraps to 0 after the last day. */
export function nextRotationIndex(plan: WorkoutPlan): number {
  const rotation = rotationFor(plan);
  if (!rotation) return plan.rotationIndex ?? 0;
  return ((plan.rotationIndex ?? 0) + 1) % rotation.length;
}

export function getRotationLabel(plan: WorkoutPlan): string | null {
  return rotationFor(plan)?.[plan.rotationIndex ?? 0]?.label ?? null;
}

/** Programs whose consistency progression is judged against each exercise's planned targetReps. */
export function usesPlannedRepTargets(plan: WorkoutPlan): boolean {
  return plan.programTemplate === 'phul';
}

/** Match a suggestion to a planned exercise — by planned id when present, else by name. */
export function findSuggestionForExercise<
  T extends { exerciseName: string; plannedExerciseId?: string },
>(suggestions: T[], ex: PlannedExercise): T | undefined {
  return suggestions.find((s) =>
    s.plannedExerciseId ? s.plannedExerciseId === ex.id : s.exerciseName === ex.exerciseName,
  );
}
