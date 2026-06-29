import type { WorkoutPlan, WorkoutSession } from '../types';
import type { WeightSuggestion } from './types';
import type { GZCLPSuggestion } from './gzclpProgression';
import { resolveGZCLP } from './gzclpProgression';
import { suggestWeightsForPlan } from './weightSuggestion';

export type ProgressionResult =
  | { mode: 'consistency'; suggestions: WeightSuggestion[] }
  | { mode: 'gzclp'; suggestions: GZCLPSuggestion[] };

function getLastSetData(
  sessions: WorkoutSession[],
  exerciseName: string,
  targetReps: number | string,
): { reps: number; hitAllReps: boolean } | null {
  const sorted = [...sessions].sort((a, b) => b.date.localeCompare(a.date));
  for (const session of sorted) {
    const ex = session.loggedExercises.find((e) => e.exerciseName === exerciseName);
    if (!ex) continue;
    const completedSets = ex.sets.filter((s) => s.completed);
    if (completedSets.length === 0) continue;
    const lastSet = completedSets[completedSets.length - 1];
    const target = typeof targetReps === 'number' ? targetReps : parseInt(String(targetReps), 10);
    const hitAllReps = isNaN(target) ? false : completedSets.every((s) => s.reps >= target);
    return { reps: lastSet.reps, hitAllReps };
  }
  return null;
}

function resolveGZCLPForPlan(plan: WorkoutPlan, sessions: WorkoutSession[]): GZCLPSuggestion[] {
  const results: GZCLPSuggestion[] = [];
  for (const ex of plan.exercises) {
    if (!ex.tier) continue;
    const lastSet = getLastSetData(sessions, ex.exerciseName, ex.targetReps);
    if (!lastSet) continue;
    const resolved = resolveGZCLP(
      {
        tier: ex.tier,
        stage: ex.stage,
        exerciseName: ex.exerciseName,
        suggestedWeight: ex.suggestedWeight,
      },
      lastSet,
    );
    results.push({
      exerciseName: ex.exerciseName,
      tier: ex.tier,
      schemeLabel: resolved.schemeLabel,
      suggestedWeight: resolved.suggestedWeight,
      newStage: resolved.newStage,
      transitionReason: resolved.transitionReason,
    });
  }
  return results;
}

export function resolveProgressionForPlan(
  plan: WorkoutPlan,
  sessions: WorkoutSession[],
): ProgressionResult {
  if (plan.progressionMode === 'gzclp') {
    return { mode: 'gzclp', suggestions: resolveGZCLPForPlan(plan, sessions) };
  }
  return { mode: 'consistency', suggestions: suggestWeightsForPlan(sessions, plan.exercises) };
}
