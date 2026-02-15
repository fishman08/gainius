import { EXERCISE_CATALOG } from '../data/exerciseCatalog';
import type { CatalogExercise, ExerciseCategory } from '../data/exerciseCatalog';

interface ScoredExercise {
  exercise: CatalogExercise;
  score: number;
}

function scoreMatch(query: string, target: string): number {
  const q = query.toLowerCase();
  const t = target.toLowerCase();
  if (q === t) return 100;
  if (t.startsWith(q)) return 80;
  if (t.includes(q)) return 60;
  // Check individual words
  const words = q.split(/\s+/);
  const allWordsMatch = words.every((w) => t.includes(w));
  if (allWordsMatch) return 40;
  return 0;
}

export function searchExercises(query: string, limit = 10): CatalogExercise[] {
  if (!query.trim()) return [];
  const q = query.trim();

  const scored: ScoredExercise[] = [];

  for (const exercise of EXERCISE_CATALOG) {
    let bestScore = scoreMatch(q, exercise.name);

    if (exercise.aliases) {
      for (const alias of exercise.aliases) {
        const aliasScore = scoreMatch(q, alias);
        if (aliasScore > bestScore) bestScore = aliasScore;
      }
    }

    // Also match on primaryMuscles (lower priority)
    if (bestScore === 0 && exercise.primaryMuscles) {
      for (const muscle of exercise.primaryMuscles) {
        const muscleScore = scoreMatch(q, muscle);
        if (muscleScore > 0) {
          bestScore = Math.max(bestScore, Math.min(muscleScore, 30));
        }
      }
    }

    if (bestScore > 0) {
      scored.push({ exercise, score: bestScore });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((s) => s.exercise);
}

export function getExercisesByCategory(category: ExerciseCategory): CatalogExercise[] {
  return EXERCISE_CATALOG.filter((e) => e.category === category);
}

export function normalizeExerciseName(input: string): string {
  const q = input.trim().toLowerCase();

  for (const exercise of EXERCISE_CATALOG) {
    if (exercise.name.toLowerCase() === q) return exercise.name;
    if (exercise.aliases) {
      for (const alias of exercise.aliases) {
        if (alias.toLowerCase() === q) return exercise.name;
      }
    }
  }

  return input;
}
