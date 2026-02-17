import type {
  WorkoutSession,
  WorkoutPlan,
  UserPreferences,
  ChatMessage,
  PlannedExercise,
} from '../types';
import type { WeightSuggestion } from '../analytics/types';

const HISTORY_WINDOW_DAYS = 14;

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export interface PreviousPlanData {
  plan: WorkoutPlan;
  completionRate: number;
  totalVolume: number;
  exerciseProgression: ExerciseProgression[];
}

export interface ExerciseProgression {
  exerciseName: string;
  direction: 'progressed' | 'stalled' | 'regressed';
}

export interface ContextOptions {
  recentSessions?: WorkoutSession[];
  goals?: string;
  preferences?: UserPreferences;
  customSystemPrompt?: string;
  weightSuggestions?: WeightSuggestion[];
  previousPlanContext?: string;
  previousPlanData?: PreviousPlanData;
  previousMessages?: ChatMessage[];
}

function filterSessionsByDate(sessions: WorkoutSession[]): WorkoutSession[] {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - HISTORY_WINDOW_DAYS);
  const cutoffStr = cutoff.toISOString().slice(0, 10);
  return sessions.filter((s) => s.date >= cutoffStr);
}

function formatSession(session: WorkoutSession, weightUnit: string): string {
  const date = session.date;
  const exercises = session.loggedExercises
    .map((ex) => {
      const completedSets = ex.sets.filter((s) => s.completed);
      if (completedSets.length === 0) return `  - ${ex.exerciseName}: no sets logged`;
      const bestSet = completedSets.reduce(
        (best, set) => (set.weight > (best?.weight ?? 0) ? set : best),
        completedSets[0],
      );
      if (!bestSet) return `  - ${ex.exerciseName}: no sets logged`;
      const weightLabel = bestSet.weight === 0 ? 'bodyweight' : `${bestSet.weight} ${weightUnit}`;
      return `  - ${ex.exerciseName}: ${weightLabel} x ${bestSet.reps} reps (${completedSets.length} sets)`;
    })
    .join('\n');

  return `${date}:\n${exercises}`;
}

function groupExercisesByDay(exercises: PlannedExercise[]): Map<number, PlannedExercise[]> {
  const groups = new Map<number, PlannedExercise[]>();
  for (const ex of exercises) {
    const day = ex.dayOfWeek;
    if (!groups.has(day)) groups.set(day, []);
    groups.get(day)!.push(ex);
  }
  return groups;
}

function formatPreviousPlan(data: PreviousPlanData, weightUnit: string): string {
  const { plan, completionRate, totalVolume, exerciseProgression } = data;
  const parts: string[] = [];

  parts.push(`Week ${plan.weekNumber} plan (created ${plan.startDate}):`);
  parts.push('');

  const byDay = groupExercisesByDay(plan.exercises);
  const sortedDays = [...byDay.keys()].sort((a, b) => a - b);

  for (const day of sortedDays) {
    const exercises = byDay.get(day)!;
    const dayName = DAY_NAMES[day] || `Day ${day}`;
    parts.push(`**${dayName}**`);
    for (const ex of exercises) {
      const reps = ex.targetReps;
      const repsStr =
        reps === 'failure'
          ? 'to failure'
          : reps === 'max'
            ? 'max reps'
            : `${ex.targetSets} sets x ${reps} reps`;
      const weightStr = ex.suggestedWeight ? ` at ${ex.suggestedWeight} ${weightUnit}` : '';
      if (reps === 'failure') {
        parts.push(`- ${ex.exerciseName}: ${ex.targetSets} sets ${repsStr}${weightStr}`);
      } else if (reps === 'max') {
        parts.push(`- ${ex.exerciseName}: ${ex.targetSets} sets x ${repsStr}${weightStr}`);
      } else {
        parts.push(`- ${ex.exerciseName}: ${repsStr}${weightStr}`);
      }
    }
    parts.push('');
  }

  parts.push(`Completion rate: ${Math.round(completionRate)}%`);
  parts.push(`Total volume achieved: ${totalVolume.toLocaleString()} ${weightUnit}`);

  const progressed = exerciseProgression
    .filter((e) => e.direction === 'progressed')
    .map((e) => e.exerciseName);
  const stalled = exerciseProgression
    .filter((e) => e.direction === 'stalled')
    .map((e) => e.exerciseName);
  const regressed = exerciseProgression
    .filter((e) => e.direction === 'regressed')
    .map((e) => e.exerciseName);

  if (progressed.length > 0) {
    parts.push(`Exercises with progression (\u2191): ${progressed.join(', ')}`);
  }
  if (stalled.length > 0) {
    parts.push(`Exercises stalled (\u2192): ${stalled.join(', ')}`);
  }
  if (regressed.length > 0) {
    parts.push(`Exercises regressed (\u2193): ${regressed.join(', ')}`);
  }

  return parts.join('\n');
}

const BASE_INSTRUCTION = `You are a knowledgeable personal fitness coach. Help the user with workout planning, exercise selection, and training advice.

When providing workout plans, format each exercise as a bullet point on its own line using one of these exact formats:

- Exercise Name: X sets x Y reps at Z lbs
- Exercise Name: XxY at Z lbs
- Exercise Name: X sets to failure
- Exercise Name: X sets x max reps

Always use a dash (-) at the start of each exercise line so they can be automatically extracted. Do not use tables, numbered lists, or other formats for exercise prescriptions.

When creating a weekly plan, organize exercises by day using this header format:

**Monday**
- Bench Press: 4 sets x 8 reps at 135 lbs
- Incline DB Press: 3 sets x 10 reps at 50 lbs

**Wednesday**
- Squat: 4 sets x 6 reps at 225 lbs

This allows the app to assign exercises to specific days.

When suggesting weights, always include the unit (lbs or kg based on user preference). Keep responses conversational but always use the bullet format above when listing exercises in a plan.`;

export function buildSystemPrompt(options: ContextOptions): string {
  const weightUnit = options.preferences?.weightUnit ?? 'lbs';
  const parts: string[] = [BASE_INSTRUCTION];

  if (options.customSystemPrompt) {
    parts.push('', 'Additional instructions from the user:', options.customSystemPrompt);
  }

  if (options.preferences) {
    parts.push('', `User preferences: weight unit = ${options.preferences.weightUnit}`);
  }

  if (options.goals) {
    parts.push('', `User goals: ${options.goals}`);
  }

  if (options.recentSessions && options.recentSessions.length > 0) {
    const sessions = filterSessionsByDate(options.recentSessions);
    if (sessions.length > 0) {
      parts.push('', 'Recent workout history (last 2 weeks):');
      sessions.forEach((s) => parts.push(formatSession(s, weightUnit)));
    }
  }

  if (options.weightSuggestions && options.weightSuggestions.length > 0) {
    parts.push('', 'AI weight suggestions based on recent performance:');
    for (const s of options.weightSuggestions) {
      const arrow =
        s.direction === 'increase' ? '\u2191' : s.direction === 'decrease' ? '\u2193' : '\u2192';
      parts.push(
        `  - ${s.exerciseName}: ${s.suggestedWeight} ${weightUnit} ${arrow} (${s.reason})`,
      );
    }
    parts.push(
      '',
      'Use these suggestions to inform your advice. Mention them when relevant to the conversation.',
    );
  }

  if (options.previousMessages && options.previousMessages.length > 0) {
    const messagePairs = options.previousMessages.slice(-6);
    parts.push('', 'Recent conversation context:');
    for (const msg of messagePairs) {
      const truncated = msg.content.length > 200 ? msg.content.slice(0, 200) + '...' : msg.content;
      const role = msg.role === 'user' ? 'User' : 'Assistant';
      parts.push(`${role}: ${truncated}`);
    }
    parts.push('', 'Use the above context to maintain continuity with the previous conversation.');
  }

  if (options.previousPlanData) {
    parts.push(
      '',
      'Previous workout plan context:',
      '',
      formatPreviousPlan(options.previousPlanData, weightUnit),
      '',
      'When creating a replacement plan:',
      '- Progress exercises that showed improvement (\u2191) by increasing weight or volume',
      '- Modify exercises where the user stalled (\u2192) \u2014 consider rep scheme changes, tempo variation, or accessory swaps',
      '- Reduce load or substitute exercises where the user regressed (\u2193)',
      '- Preserve the overall training split structure unless the user requests changes',
    );
  } else if (options.previousPlanContext) {
    parts.push(
      '',
      'Previous workout plan context:',
      options.previousPlanContext,
      '',
      "When creating a new plan, build on previous week's progress. Explain what changed and why.",
    );
  }

  return parts.join('\n');
}
