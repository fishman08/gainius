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

export interface KnowledgeSnippet {
  title: string;
  source: string;
  content: string;
  evidence_quality: string;
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
  knowledgeContext?: KnowledgeSnippet[];
}

function filterSessionsByDate(sessions: WorkoutSession[]): WorkoutSession[] {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - HISTORY_WINDOW_DAYS);
  const cutoffStr = cutoff.toISOString().slice(0, 10);
  return sessions.filter((s) => s.date >= cutoffStr);
}

function formatSession(session: WorkoutSession, weightUnit: string): string {
  const exercises = session.loggedExercises
    .map((ex) => {
      const completedSets = ex.sets.filter((s) => s.completed);
      if (completedSets.length === 0) return `  - ${ex.exerciseName}: no sets logged`;
      const setDetails = completedSets
        .map((s) => {
          const w = s.weight === 0 ? 'BW' : `${s.weight}`;
          const rpe = s.rpe ? ` RPE${s.rpe}` : '';
          return `${w}x${s.reps}${rpe}`;
        })
        .join(', ');
      return `  - ${ex.exerciseName}: ${setDetails} ${weightUnit}`;
    })
    .join('\n');

  return `${session.date}:\n${exercises}`;
}

function formatCardioSession(session: WorkoutSession): string {
  if (!session.cardioLog) return `${session.date}: cardio`;
  const { activityType, durationSeconds, distanceMeters } = session.cardioLog;
  const minutes = Math.floor(durationSeconds / 60);
  const secs = durationSeconds % 60;
  const durationStr = secs > 0 ? `${minutes}m ${secs}s` : `${minutes}m`;
  const kmStr = distanceMeters ? ` — ${(distanceMeters / 1000).toFixed(2)} km` : '';
  return `${session.date}: ${activityType} ${durationStr}${kmStr}`;
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

CRITICAL — EXERCISE FORMAT RULES (the app parses your output automatically):

Every exercise MUST be a dash-prefixed bullet with the name, sets, reps, and weight on ONE line. Use one of these exact formats:

- Exercise Name: X sets x Y reps at Z lbs
- Exercise Name: XxY at Z lbs
- Exercise Name: X sets to failure
- Exercise Name: X sets x max reps

WRONG (the app cannot parse these — NEVER do this):
  A. Back Squats          ← letter-prefixed headers break parsing
  165 lbs: 4 sets x 5 reps  ← weight-first on separate line breaks parsing
  1. Bench Press: 4x8     ← numbered lists break parsing

RIGHT (always do this):
  - Back Squats: 4 sets x 5 reps at 165 lbs
  - Bench Press: 4 sets x 8 reps at 135 lbs

When creating a weekly plan, organize exercises by day using bold day headers:

**Monday**
- Bench Press: 4 sets x 8 reps at 135 lbs
- Incline DB Press: 3 sets x 10 reps at 50 lbs

**Wednesday**
- Squat: 4 sets x 6 reps at 225 lbs

Always include the weight unit (lbs or kg). Keep responses conversational but ALWAYS use the dash-bullet format above for exercises. This is non-negotiable — the app will fail to extract exercises in any other format.`;

export function buildSystemPrompt(options: ContextOptions): string {
  const weightUnit = options.preferences?.weightUnit ?? 'lbs';
  const parts: string[] = [BASE_INSTRUCTION];

  if (options.customSystemPrompt) {
    parts.push('', 'Additional instructions from the user:', options.customSystemPrompt);
  }

  if (options.preferences) {
    parts.push('', `User preferences: weight unit = ${options.preferences.weightUnit}`);
    if (options.preferences.trainingPhase) {
      const phaseGuidance: Record<string, string> = {
        cut: 'User is in a CUT phase (caloric deficit). Prioritize strength preservation over progression, manage fatigue carefully, keep intensity high but reduce total volume, avoid aggressive weight increases, monitor recovery.',
        bulk: 'User is in a BULK phase (caloric surplus). Prioritize progressive overload, higher training volume, push for weight/rep PRs.',
        maintain:
          'User is in a MAINTENANCE phase. Sustain current strength, moderate volume, balanced approach.',
        recomp:
          'User is in a RECOMPOSITION phase. Moderate progressive overload, balanced volume, prioritize protein timing.',
      };
      parts.push(
        `Training phase: ${options.preferences.trainingPhase.toUpperCase()}`,
        phaseGuidance[options.preferences.trainingPhase],
      );
    }
  }

  if (options.goals) {
    parts.push('', `User goals: ${options.goals}`);
  }

  if (options.recentSessions && options.recentSessions.length > 0) {
    const sessions = filterSessionsByDate(options.recentSessions);
    if (sessions.length > 0) {
      parts.push(
        '',
        'Recent workout history (last 2 weeks) — newest first, per-set format = weight x reps RPE#:',
      );
      const sortedNewestFirst = [...sessions].sort((a, b) => (a.date < b.date ? 1 : -1));
      sortedNewestFirst.forEach((s) => {
        if (s.sessionType === 'cardio') {
          parts.push(formatCardioSession(s));
        } else {
          parts.push(formatSession(s, weightUnit));
        }
      });
      parts.push(
        '',
        'Use this logged history when making recommendations: cite specific recent sets when suggesting next-session weights, flag exercises trending up vs stalling, and reference the user’s actual numbers rather than generic guidance.',
      );
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
      if (s.recentSets) {
        for (const rs of s.recentSets) {
          const sets = rs.sets.map((st) => `${st.weight}x${st.reps}`).join(', ');
          parts.push(`      ${rs.date}: ${sets}`);
        }
      }
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

  if (options.knowledgeContext && options.knowledgeContext.length > 0) {
    parts.push('', 'Relevant exercise science knowledge:');
    for (const snippet of options.knowledgeContext) {
      parts.push(`  [${snippet.source} — ${snippet.evidence_quality}] ${snippet.title}`);
      parts.push(`  ${snippet.content.slice(0, 500)}`);
      parts.push('');
    }
    parts.push(
      'Use the above knowledge to inform your advice when relevant. Cite the source name when referencing specific findings.',
    );
  }

  // Reinforce format rules at the end (recency effect)
  parts.push(
    '',
    'Reminder: Every exercise must be a dash-bullet line with name, sets, reps, and weight on ONE line (e.g., "- Squat: 4 sets x 5 reps at 165 lbs"). No letter prefixes, no numbered lists, no weight-first lines.',
  );

  return parts.join('\n');
}

export function buildSessionReviewPrompt(
  session: WorkoutSession,
  plan: WorkoutPlan | null,
  weightUnit: string,
): string {
  const parts: string[] = [];
  parts.push('You are a knowledgeable fitness coach reviewing a completed workout session.');
  parts.push('');
  parts.push(
    'IMPORTANT: Do NOT output exercises in dash-bullet format (e.g., "- Bench Press: 4 sets x 8 reps"). Use plain prose only. The app parser will accidentally extract formatted exercises from your review.',
  );
  parts.push('');
  parts.push(`Session date: ${session.date}`);
  if (session.startTime && session.endTime) {
    const durationMin = Math.round(
      (new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / 60000,
    );
    parts.push(`Duration: ${durationMin} minutes`);
  }
  parts.push('');
  parts.push('Completed exercises:');
  for (const ex of session.loggedExercises) {
    const completedSets = ex.sets.filter((s) => s.completed);
    if (completedSets.length === 0) {
      parts.push(`  ${ex.exerciseName}: skipped`);
      continue;
    }
    const setDetails = completedSets
      .map((s) => {
        const w = s.weight === 0 ? 'BW' : `${s.weight}`;
        const rpe = s.rpe ? ` RPE${s.rpe}` : '';
        return `${w}x${s.reps}${rpe}`;
      })
      .join(', ');
    parts.push(`  ${ex.exerciseName}: ${setDetails} ${weightUnit}`);
  }

  if (plan) {
    parts.push('');
    parts.push('Planned vs actual:');
    for (const planned of plan.exercises) {
      const logged = session.loggedExercises.find(
        (ex) => ex.plannedExerciseId === planned.id || ex.exerciseName === planned.exerciseName,
      );
      if (!logged) {
        parts.push(
          `  ${planned.exerciseName}: planned ${planned.targetSets}x${planned.targetReps} — MISSED`,
        );
        continue;
      }
      const completedSets = logged.sets.filter((s) => s.completed);
      parts.push(
        `  ${planned.exerciseName}: planned ${planned.targetSets}x${planned.targetReps}${planned.suggestedWeight ? ` @${planned.suggestedWeight}` : ''} — did ${completedSets.length} sets`,
      );
    }
  }

  parts.push('');
  parts.push('Provide a brief review (150 words max) covering:');
  parts.push('1. Performance vs plan (if applicable)');
  parts.push('2. Volume and intensity observations');
  parts.push('3. One specific suggestion for the next session');
  parts.push('');
  parts.push('Use conversational prose. NO dash-bullet exercise lines.');

  return parts.join('\n');
}
