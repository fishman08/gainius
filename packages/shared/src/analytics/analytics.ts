import type { WorkoutSession } from '../types';
import type {
  TimePeriod,
  WorkoutStats,
  PersonalRecord,
  ExerciseAnalytics,
  ExerciseDataPoint,
  WeeklyVolume,
} from './types';

export function filterByPeriod(sessions: WorkoutSession[], period: TimePeriod): WorkoutSession[] {
  if (period === 'all') return sessions;

  const now = new Date();
  const cutoff = new Date(now);
  if (period === 'week') {
    cutoff.setDate(cutoff.getDate() - 7);
  } else {
    cutoff.setMonth(cutoff.getMonth() - 1);
  }

  const cutoffStr = cutoff.toISOString().split('T')[0];
  return sessions.filter((s) => s.date >= cutoffStr);
}

export function computeStats(sessions: WorkoutSession[]): WorkoutStats {
  let totalVolume = 0;
  let totalSets = 0;

  for (const session of sessions) {
    for (const exercise of session.loggedExercises) {
      for (const set of exercise.sets) {
        if (set.completed) {
          totalVolume += set.weight * set.reps;
          totalSets++;
        }
      }
    }
  }

  let avgWorkoutsPerWeek = 0;
  if (sessions.length >= 2) {
    const dates = sessions.map((s) => new Date(s.date).getTime());
    const earliest = Math.min(...dates);
    const latest = Math.max(...dates);
    const weeks = Math.max((latest - earliest) / (7 * 24 * 60 * 60 * 1000), 1);
    avgWorkoutsPerWeek = Math.round((sessions.length / weeks) * 10) / 10;
  } else {
    avgWorkoutsPerWeek = sessions.length;
  }

  return {
    totalWorkouts: sessions.length,
    totalVolume,
    totalSets,
    avgWorkoutsPerWeek,
  };
}

export function getUniqueExercises(sessions: WorkoutSession[]): string[] {
  const names = new Set<string>();
  for (const session of sessions) {
    for (const exercise of session.loggedExercises) {
      names.add(exercise.exerciseName);
    }
  }
  return Array.from(names).sort();
}

export function computeExerciseAnalytics(
  sessions: WorkoutSession[],
  exerciseName: string,
): ExerciseAnalytics {
  const dataPoints: ExerciseDataPoint[] = [];
  let bestWeight = 0;
  let bestVolume = 0;
  let totalWeight = 0;
  let totalSets = 0;
  let weightEntries = 0;
  let sessionCount = 0;

  // Sort sessions by date ascending for chronological data points
  const sorted = [...sessions].sort((a, b) => a.date.localeCompare(b.date));

  for (const session of sorted) {
    for (const exercise of session.loggedExercises) {
      if (exercise.exerciseName !== exerciseName) continue;
      sessionCount++;

      for (const set of exercise.sets) {
        if (!set.completed) continue;
        totalSets++;
        totalWeight += set.weight;
        weightEntries++;

        const volume = set.weight * set.reps;
        if (set.weight > bestWeight) bestWeight = set.weight;
        if (volume > bestVolume) bestVolume = volume;

        dataPoints.push({
          date: session.date,
          weight: set.weight,
          reps: set.reps,
          volume,
        });
      }
    }
  }

  return {
    exerciseName,
    dataPoints,
    bestWeight,
    bestVolume,
    avgWeight: weightEntries > 0 ? Math.round(totalWeight / weightEntries) : 0,
    totalSets,
    sessionCount,
  };
}

export function detectPersonalRecords(sessions: WorkoutSession[]): PersonalRecord[] {
  const records: PersonalRecord[] = [];
  const bestByExercise = new Map<string, number>();

  // Process sessions oldest-first to track progression
  const sorted = [...sessions].sort((a, b) => a.date.localeCompare(b.date));

  for (const session of sorted) {
    for (const exercise of session.loggedExercises) {
      for (const set of exercise.sets) {
        if (!set.completed) continue;

        const prevBest = bestByExercise.get(exercise.exerciseName) ?? null;
        if (prevBest === null || set.weight > prevBest) {
          bestByExercise.set(exercise.exerciseName, set.weight);
          records.push({
            exerciseName: exercise.exerciseName,
            weight: set.weight,
            reps: set.reps,
            date: session.date,
            previousBest: prevBest,
          });
        }
      }
    }
  }

  return records;
}

export function getRecentPRs(sessions: WorkoutSession[], limit = 10): PersonalRecord[] {
  const allPRs = detectPersonalRecords(sessions);
  // Return most recent first
  return allPRs.reverse().slice(0, limit);
}

export function computeWeeklyVolume(sessions: WorkoutSession[]): WeeklyVolume[] {
  const weekMap = new Map<string, { volume: number; sessionCount: number }>();

  for (const session of sessions) {
    const date = new Date(session.date);
    // Get Monday of the week
    const day = date.getDay();
    const monday = new Date(date);
    monday.setDate(date.getDate() - ((day + 6) % 7));
    const weekKey = monday.toISOString().split('T')[0];

    const existing = weekMap.get(weekKey) ?? { volume: 0, sessionCount: 0 };
    existing.sessionCount++;

    for (const exercise of session.loggedExercises) {
      for (const set of exercise.sets) {
        if (set.completed) {
          existing.volume += set.weight * set.reps;
        }
      }
    }

    weekMap.set(weekKey, existing);
  }

  return Array.from(weekMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([weekKey, data]) => {
      const date = new Date(weekKey);
      const month = date.toLocaleString('default', { month: 'short' });
      const day = date.getDate();
      return {
        weekLabel: `${month} ${day}`,
        volume: Math.round(data.volume),
        sessionCount: data.sessionCount,
      };
    });
}
