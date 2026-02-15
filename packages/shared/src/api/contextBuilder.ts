import type { WorkoutSession, UserPreferences, ChatMessage } from '../types';
import type { WeightSuggestion } from '../analytics/types';

const MAX_HISTORY_SESSIONS = 5;

interface ContextOptions {
  recentSessions?: WorkoutSession[];
  goals?: string;
  preferences?: UserPreferences;
  customSystemPrompt?: string;
  weightSuggestions?: WeightSuggestion[];
  previousPlanContext?: string;
  previousMessages?: ChatMessage[];
}

function formatSession(session: WorkoutSession): string {
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
      return `  - ${ex.exerciseName}: ${bestSet.weight}${' '}x ${bestSet.reps} reps (${completedSets.length} sets)`;
    })
    .join('\n');

  return `${date}:\n${exercises}`;
}

export function buildSystemPrompt(options: ContextOptions): string {
  const parts: string[] = [
    'You are a knowledgeable personal fitness coach. Help the user with workout planning, exercise selection, and training advice.',
    '',
    'When providing workout plans, format each exercise as a bullet point on its own line, like this:',
    '- Exercise Name: X sets x Y reps at Z lbs',
    '',
    'Always use a dash (-) at the start of each exercise line so they can be automatically extracted.',
  ];

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
    const sessions = options.recentSessions.slice(0, MAX_HISTORY_SESSIONS);
    parts.push('', 'Recent workout history:');
    sessions.forEach((s) => parts.push(formatSession(s)));
  }

  if (options.weightSuggestions && options.weightSuggestions.length > 0) {
    parts.push('', 'AI weight suggestions based on recent performance:');
    for (const s of options.weightSuggestions) {
      const arrow = s.direction === 'increase' ? '↑' : s.direction === 'decrease' ? '↓' : '→';
      parts.push(`  - ${s.exerciseName}: ${s.suggestedWeight} lbs ${arrow} (${s.reason})`);
    }
    parts.push(
      '',
      'Use these suggestions to inform your advice. Mention them when relevant to the conversation.',
    );
  }

  if (options.previousMessages && options.previousMessages.length > 0) {
    const messagePairs = options.previousMessages.slice(-6);
    parts.push('', 'Recent conversation context (from previous session):');
    for (const msg of messagePairs) {
      const truncated = msg.content.length > 200 ? msg.content.slice(0, 200) + '...' : msg.content;
      parts.push(`  ${msg.role}: ${truncated}`);
    }
    parts.push('', 'Use the above context to maintain continuity with the previous conversation.');
  }

  if (options.previousPlanContext) {
    parts.push(
      '',
      'Previous week plan and performance:',
      options.previousPlanContext,
      '',
      "When creating a new plan, build on previous week's progress. Explain what changed and why.",
    );
  }

  return parts.join('\n');
}
