import type { WorkoutSession, PlannedExercise } from '../types';
import type { WeightSuggestion } from './types';

function roundToNearest(value: number, nearest: number): number {
  return Math.round(value / nearest) * nearest;
}

export function suggestWeight(
  sessions: WorkoutSession[],
  exerciseName: string,
): WeightSuggestion | null {
  // Collect completed sets for this exercise across sessions
  const exerciseSessions: {
    date: string;
    sets: { weight: number; reps: number; rpe?: number }[];
    targetReps?: number;
  }[] = [];

  // Sort newest first, take last 3
  const sorted = [...sessions].sort((a, b) => b.date.localeCompare(a.date));

  for (const session of sorted) {
    for (const exercise of session.loggedExercises) {
      if (exercise.exerciseName !== exerciseName) continue;
      const completedSets = exercise.sets
        .filter((s) => s.completed && s.weight > 0)
        .map((s) => ({ weight: s.weight, reps: s.reps, rpe: s.rpe }));

      if (completedSets.length > 0) {
        exerciseSessions.push({ date: session.date, sets: completedSets });
      }
    }
    if (exerciseSessions.length >= 3) break;
  }

  if (exerciseSessions.length < 2) return null;

  // Get the most recent weight used
  const recentSets = exerciseSessions[0].sets;
  const currentWeight = Math.max(...recentSets.map((s) => s.weight));
  const avgReps = recentSets.reduce((sum, s) => sum + s.reps, 0) / recentSets.length;

  // Check consistency: did the user complete target reps across sessions?
  const allSets = exerciseSessions.flatMap((s) => s.sets);
  const atCurrentWeight = allSets.filter((s) => s.weight >= currentWeight * 0.95);
  // Check RPE if available
  const rpeSets = allSets.filter((s) => s.rpe !== undefined);
  const avgRpe =
    rpeSets.length > 0 ? rpeSets.reduce((sum, s) => sum + (s.rpe ?? 0), 0) / rpeSets.length : null;

  // High RPE (>9) → don't increase even if reps are consistent
  if (avgRpe !== null && avgRpe > 9) {
    return {
      exerciseName,
      currentWeight,
      suggestedWeight: currentWeight,
      direction: 'same',
      confidence: 'medium',
      reason: 'RPE is high — maintain current weight',
    };
  }

  // Calculate rep consistency (% of sets hitting >= typical rep range)
  const typicalTargetReps = Math.round(avgReps);
  const hittingTarget = atCurrentWeight.filter((s) => s.reps >= typicalTargetReps).length;
  const consistency = atCurrentWeight.length > 0 ? hittingTarget / atCurrentWeight.length : 0;

  if (consistency >= 0.9) {
    // Strong consistency → suggest increase
    const increase = currentWeight * 0.025; // 2.5% bump
    const suggested = roundToNearest(currentWeight + Math.max(increase, 2.5), 2.5);
    return {
      exerciseName,
      currentWeight,
      suggestedWeight: suggested,
      direction: 'increase',
      confidence: 'high',
      reason: `Consistently hitting ${typicalTargetReps} reps — ready to progress`,
    };
  }

  if (consistency >= 0.7) {
    return {
      exerciseName,
      currentWeight,
      suggestedWeight: currentWeight,
      direction: 'same',
      confidence: 'medium',
      reason: 'Getting close — keep current weight until more consistent',
    };
  }

  // Low consistency → consider decrease
  const decrease = currentWeight * 0.05;
  const suggested = roundToNearest(currentWeight - decrease, 2.5);
  if (suggested < currentWeight) {
    return {
      exerciseName,
      currentWeight,
      suggestedWeight: suggested,
      direction: 'decrease',
      confidence: 'medium',
      reason: 'Struggling with current weight — consider a small reduction',
    };
  }

  return {
    exerciseName,
    currentWeight,
    suggestedWeight: currentWeight,
    direction: 'same',
    confidence: 'medium',
    reason: 'Maintain current weight',
  };
}

export function suggestWeightsForPlan(
  sessions: WorkoutSession[],
  exercises: PlannedExercise[],
): WeightSuggestion[] {
  const suggestions: WeightSuggestion[] = [];
  for (const exercise of exercises) {
    const suggestion = suggestWeight(sessions, exercise.exerciseName);
    if (suggestion) suggestions.push(suggestion);
  }
  return suggestions;
}
