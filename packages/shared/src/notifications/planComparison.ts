import type { WorkoutPlan } from '../types';
import type { PlanComparison, PlanComparisonSummary, PlanChange } from '../types/notification';

function summarizePlan(plan: WorkoutPlan): PlanComparisonSummary {
  return {
    weekNumber: plan.weekNumber,
    startDate: plan.startDate,
    endDate: plan.endDate,
    exerciseCount: plan.exercises.length,
    totalSets: plan.exercises.reduce((sum, ex) => sum + ex.targetSets, 0),
  };
}

function describeExercise(
  oldEx: { targetSets: number; targetReps: number | string; suggestedWeight?: number },
  newEx: { targetSets: number; targetReps: number | string; suggestedWeight?: number },
): string {
  const parts: string[] = [];
  if (oldEx.targetSets !== newEx.targetSets) {
    parts.push(`Sets ${oldEx.targetSets}→${newEx.targetSets}`);
  }
  if (String(oldEx.targetReps) !== String(newEx.targetReps)) {
    parts.push(`Reps ${oldEx.targetReps}→${newEx.targetReps}`);
  }
  if ((oldEx.suggestedWeight ?? 0) !== (newEx.suggestedWeight ?? 0)) {
    parts.push(`Weight ${oldEx.suggestedWeight ?? 0}→${newEx.suggestedWeight ?? 0} lbs`);
  }
  return parts.join(', ');
}

function formatExerciseValue(ex: {
  targetSets: number;
  targetReps: number | string;
  suggestedWeight?: number;
}): string {
  const w = ex.suggestedWeight ? ` @ ${ex.suggestedWeight} lbs` : '';
  return `${ex.targetSets}x${ex.targetReps}${w}`;
}

export function comparePlans(
  oldPlan: WorkoutPlan,
  newPlan: WorkoutPlan,
  claudeReasoning?: string,
): PlanComparison {
  const oldNames = new Map(oldPlan.exercises.map((ex) => [ex.exerciseName.toLowerCase(), ex]));
  const newNames = new Map(newPlan.exercises.map((ex) => [ex.exerciseName.toLowerCase(), ex]));

  const changes: PlanChange[] = [];

  // Check old exercises against new
  for (const [key, oldEx] of oldNames) {
    const newEx = newNames.get(key);
    if (!newEx) {
      changes.push({
        exerciseName: oldEx.exerciseName,
        changeType: 'removed',
        oldValue: formatExerciseValue(oldEx),
      });
    } else {
      const details = describeExercise(oldEx, newEx);
      changes.push({
        exerciseName: oldEx.exerciseName,
        changeType: details ? 'modified' : 'unchanged',
        oldValue: formatExerciseValue(oldEx),
        newValue: formatExerciseValue(newEx),
        details: details || undefined,
      });
    }
  }

  // Check for added exercises
  for (const [key, newEx] of newNames) {
    if (!oldNames.has(key)) {
      changes.push({
        exerciseName: newEx.exerciseName,
        changeType: 'added',
        newValue: formatExerciseValue(newEx),
      });
    }
  }

  return {
    oldPlan: summarizePlan(oldPlan),
    newPlan: summarizePlan(newPlan),
    changes,
    claudeReasoning,
  };
}
