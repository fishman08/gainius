import type { WorkoutPlan, WorkoutSession } from '../types';
import type { WeightSuggestion } from '../analytics/types';

export function buildPlanUpdateContext(
  plan: WorkoutPlan,
  sessionsThisWeek: WorkoutSession[],
  weightSuggestions: WeightSuggestion[],
): string {
  const parts: string[] = [
    `Previous week plan (Week ${plan.weekNumber}): ${plan.startDate} to ${plan.endDate}`,
    '',
    'Planned exercises:',
  ];

  for (const ex of plan.exercises) {
    const weight = ex.suggestedWeight ? ` @ ${ex.suggestedWeight} lbs` : '';
    parts.push(`  - ${ex.exerciseName}: ${ex.targetSets}x${ex.targetReps}${weight}`);
  }

  const completedSessions = sessionsThisWeek.filter((s) => s.completed);
  const completionRate =
    sessionsThisWeek.length > 0
      ? Math.round((completedSessions.length / sessionsThisWeek.length) * 100)
      : 0;

  parts.push(
    '',
    `Completion: ${completedSessions.length}/${sessionsThisWeek.length} sessions (${completionRate}%)`,
  );

  if (completedSessions.length > 0) {
    let totalVolume = 0;
    for (const session of completedSessions) {
      for (const ex of session.loggedExercises) {
        for (const set of ex.sets) {
          if (set.completed) totalVolume += set.weight * set.reps;
        }
      }
    }
    parts.push(`Total volume this week: ${totalVolume.toLocaleString()} lbs`);
  }

  if (weightSuggestions.length > 0) {
    parts.push('', 'Weight progression suggestions:');
    for (const s of weightSuggestions) {
      const arrow = s.direction === 'increase' ? '↑' : s.direction === 'decrease' ? '↓' : '→';
      parts.push(
        `  - ${s.exerciseName}: ${s.currentWeight}→${s.suggestedWeight} lbs ${arrow} (${s.reason})`,
      );
    }
  }

  parts.push(
    '',
    'Create a new weekly plan building on this progress. Explain what changed and why.',
  );

  return parts.join('\n');
}
