/**
 * wger Workout Manager API crawler
 * Open-source REST API — no auth required for public endpoints
 */

import { fetchJson, sleep, makeId, truncate } from '../http.js';
import type { KnowledgeChunk, CrawlerResult } from '../types.js';

const API_BASE = 'https://wger.de/api/v2';

interface WgerExerciseResponse {
  count: number;
  next: string | null;
  results: WgerExercise[];
}

interface WgerExercise {
  id: number;
  name: string;
  description: string;
  muscles: number[];
  muscles_secondary: number[];
  equipment: number[];
  category: number;
}

interface WgerCategory {
  id: number;
  name: string;
}

interface WgerMuscle {
  id: number;
  name: string;
  name_en: string;
  is_front: boolean;
}

interface WgerEquipment {
  id: number;
  name: string;
}

export async function crawlWger(): Promise<CrawlerResult> {
  const errors: string[] = [];
  const chunks: KnowledgeChunk[] = [];

  console.log('  [wger] Fetching reference data...');

  // Load reference data
  let categories: Record<number, string> = {};
  let muscles: Record<number, string> = {};
  let equipment: Record<number, string> = {};

  try {
    const catRes = await fetchJson<{ results: WgerCategory[] }>(
      `${API_BASE}/exercisecategory/?format=json&limit=100`,
    );
    categories = Object.fromEntries(catRes.results.map((c) => [c.id, c.name]));
    await sleep(300);

    const muscleRes = await fetchJson<{ results: WgerMuscle[] }>(
      `${API_BASE}/muscle/?format=json&limit=100`,
    );
    muscles = Object.fromEntries(muscleRes.results.map((m) => [m.id, m.name_en || m.name]));
    await sleep(300);

    const equipRes = await fetchJson<{ results: WgerEquipment[] }>(
      `${API_BASE}/equipment/?format=json&limit=100`,
    );
    equipment = Object.fromEntries(equipRes.results.map((e) => [e.id, e.name]));
    await sleep(300);
  } catch (e) {
    errors.push(`wger reference data failed: ${(e as Error).message}`);
    return { chunks, source: 'wger', fetched: 0, errors };
  }

  // Paginate through exercises (English = language 2)
  let url: string | null = `${API_BASE}/exercise/?format=json&language=2&limit=100`;
  let page = 0;

  while (url && page < 10) {
    try {
      console.log(`  [wger] Fetching page ${page + 1}...`);
      const res = await fetchJson<WgerExerciseResponse>(url);

      for (const ex of res.results) {
        if (!ex.name || !ex.description) continue;

        // Strip HTML from description — keep content even if short
        const cleanDesc = ex.description
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();

        const muscleNames = ex.muscles.map((id) => muscles[id]).filter(Boolean);
        const secondaryNames = ex.muscles_secondary.map((id) => muscles[id]).filter(Boolean);
        const equipNames = ex.equipment.map((id) => equipment[id]).filter(Boolean);
        const categoryName = categories[ex.category] ?? '';

        const content = [
          `Exercise: ${ex.name}`,
          categoryName ? `Category: ${categoryName}` : '',
          muscleNames.length > 0 ? `Primary muscles: ${muscleNames.join(', ')}` : '',
          secondaryNames.length > 0 ? `Secondary muscles: ${secondaryNames.join(', ')}` : '',
          equipNames.length > 0 ? `Equipment: ${equipNames.join(', ')}` : '',
          '',
          cleanDesc,
        ]
          .filter(Boolean)
          .join('\n');

        const tags = [...muscleNames, ...secondaryNames, ...equipNames, categoryName].filter(
          Boolean,
        );

        chunks.push({
          id: makeId('wger', String(ex.id)),
          source: 'wger',
          title: ex.name,
          content: truncate(content),
          categories: ['strength_hypertrophy'],
          evidence_quality: 'medium',
          url: `https://wger.de/en/exercise/${ex.id}/view/`,
          fetched_at: new Date().toISOString(),
          tags,
        });
      }

      url = res.next;
      page++;
      await sleep(500);
    } catch (e) {
      errors.push(`wger page ${page} failed: ${(e as Error).message}`);
      break;
    }
  }

  return { chunks, source: 'wger', fetched: chunks.length, errors };
}
