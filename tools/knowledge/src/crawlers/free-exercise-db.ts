/**
 * free-exercise-db crawler
 * Public domain exercise database from GitHub — single JSON download
 */

import { fetchJson, makeId, truncate } from '../http.js';
import type { KnowledgeChunk, CrawlerResult } from '../types.js';

const EXERCISES_URL =
  'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json';

interface FreeExercise {
  name: string;
  force: string | null;
  level: string;
  mechanic: string | null;
  equipment: string | null;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  instructions: string[];
  category: string;
  images?: string[];
}

function categorizeExercise(ex: FreeExercise): string[] {
  const cats: string[] = [];
  const cat = ex.category?.toLowerCase() ?? '';
  const name = ex.name.toLowerCase();

  if (/strength|powerlifting|olympic/.test(cat) || ex.force === 'push' || ex.force === 'pull')
    cats.push('strength_hypertrophy');
  if (/cardio/.test(cat)) cats.push('cardio_endurance');
  if (/stretch/.test(cat) || /stretch/.test(name)) cats.push('flexibility');
  if (!ex.equipment || ex.equipment === 'body only') cats.push('calisthenics_bodyweight');

  return cats.length > 0 ? cats : ['strength_hypertrophy'];
}

function buildContent(ex: FreeExercise): string {
  const parts: string[] = [];
  parts.push(`Exercise: ${ex.name}`);
  if (ex.level) parts.push(`Level: ${ex.level}`);
  if (ex.equipment) parts.push(`Equipment: ${ex.equipment}`);
  if (ex.force) parts.push(`Force: ${ex.force}`);
  if (ex.mechanic) parts.push(`Mechanic: ${ex.mechanic}`);
  if (ex.primaryMuscles.length > 0) parts.push(`Primary muscles: ${ex.primaryMuscles.join(', ')}`);
  if (ex.secondaryMuscles.length > 0)
    parts.push(`Secondary muscles: ${ex.secondaryMuscles.join(', ')}`);
  if (ex.instructions.length > 0) {
    parts.push('');
    parts.push('Instructions:');
    ex.instructions.forEach((inst, i) => parts.push(`${i + 1}. ${inst}`));
  }
  return parts.join('\n');
}

export async function crawlFreeExerciseDb(): Promise<CrawlerResult> {
  const errors: string[] = [];
  const chunks: KnowledgeChunk[] = [];

  console.log('  [free-exercise-db] Fetching exercises JSON...');

  try {
    const exercises = await fetchJson<FreeExercise[]>(EXERCISES_URL, 30000);
    console.log(`  [free-exercise-db] Downloaded ${exercises.length} exercises`);

    for (const ex of exercises) {
      if (!ex.name || !ex.instructions || ex.instructions.length === 0) continue;

      const tags = [
        ...(ex.primaryMuscles ?? []),
        ...(ex.secondaryMuscles ?? []),
        ex.equipment,
        ex.level,
        ex.category,
      ].filter(Boolean) as string[];

      chunks.push({
        id: makeId('free-exercise-db', ex.name),
        source: 'free-exercise-db',
        title: ex.name,
        content: truncate(buildContent(ex)),
        categories: categorizeExercise(ex),
        evidence_quality: 'medium',
        url: `https://github.com/yuhonas/free-exercise-db`,
        fetched_at: new Date().toISOString(),
        tags,
      });
    }
  } catch (e) {
    errors.push(`free-exercise-db fetch failed: ${(e as Error).message}`);
  }

  return { chunks, source: 'free-exercise-db', fetched: chunks.length, errors };
}
