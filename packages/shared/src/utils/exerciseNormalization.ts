import type { StorageService } from '../storage';
import { normalizeExerciseName } from './exerciseSearch';

interface NormalizationResult {
  updated: number;
  total: number;
}

export async function normalizeHistoricalExercises(
  storage: StorageService,
  userId: string,
): Promise<NormalizationResult> {
  const sessions = await storage.getWorkoutHistory(userId, 500);
  let updated = 0;

  for (const session of sessions) {
    let changed = false;
    for (const exercise of session.loggedExercises) {
      const normalized = normalizeExerciseName(exercise.exerciseName);
      if (normalized !== exercise.exerciseName) {
        exercise.exerciseName = normalized;
        changed = true;
      }
    }
    if (changed) {
      await storage.saveWorkoutSession(session);
      updated++;
    }
  }

  return { updated, total: sessions.length };
}
