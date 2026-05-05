#!/usr/bin/env tsx
/**
 * Dry-run: crawl 3 sources, print 2 sample chunks each, no DB writes
 */

import { crawlFreeExerciseDb } from './crawlers/free-exercise-db.js';
import { crawlWger } from './crawlers/wger.js';
import type { KnowledgeChunk, CrawlerResult } from './types.js';

// Inline a minimal Breaking Muscle RSS crawl (just the main feed)
import { XMLParser } from 'fast-xml-parser';
import { fetchText, sleep, makeId, truncate } from './http.js';

function stripHtml(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

async function crawlBreakingMuscleMain(): Promise<CrawlerResult> {
  const errors: string[] = [];
  const chunks: KnowledgeChunk[] = [];

  try {
    const xml = await fetchText('https://breakingmuscle.com/feed/rss', 12000);
    const parser = new XMLParser({
      ignoreAttributes: false,
      isArray: (name) => name === 'item' || name === 'category',
    });
    const parsed = parser.parse(xml);
    const items = parsed?.rss?.channel?.item ?? [];

    for (const item of items) {
      const title = String(item.title ?? '');
      const link = String(item.link ?? '');
      const desc = stripHtml(String(item.description ?? item['content:encoded'] ?? ''));
      if (!title || desc.length < 50) continue;

      const cats = Array.isArray(item.category)
        ? item.category.map((c: unknown) =>
            String(
              typeof c === 'object' && c !== null
                ? ((c as Record<string, unknown>)['#text'] ?? c)
                : c,
            ),
          )
        : [];

      chunks.push({
        id: makeId('breaking-muscle', link || title),
        source: 'Breaking Muscle',
        title: truncate(title, 300),
        content: truncate(desc),
        categories: ['strength_hypertrophy', 'cardio_endurance', 'hiit_conditioning'],
        evidence_quality: 'medium',
        url: link,
        fetched_at: new Date().toISOString(),
        tags: [...cats, 'strength_hypertrophy', 'cardio_endurance', 'hiit_conditioning'],
      });
    }

    console.log(`  [Breaking Muscle] main feed → ${items.length} items, ${chunks.length} valid`);
  } catch (e) {
    errors.push(`Breaking Muscle feed failed: ${(e as Error).message}`);
  }

  return { chunks, source: 'Breaking Muscle', fetched: chunks.length, errors };
}

function printChunks(label: string, chunks: KnowledgeChunk[], count = 2) {
  console.log(`\n${'━'.repeat(70)}`);
  console.log(
    `  ${label} — ${chunks.length} total chunks, showing ${Math.min(count, chunks.length)}`,
  );
  console.log('━'.repeat(70));

  for (const chunk of chunks.slice(0, count)) {
    console.log(JSON.stringify(chunk, null, 2));
    console.log('─'.repeat(70));
  }
}

async function main() {
  console.log('\n🔬 DRY RUN — 3 sources, 2 samples each, NO DB writes\n');

  // 1. free-exercise-db
  console.log('1️⃣  free-exercise-db (JSON fetch)');
  const exDb = await crawlFreeExerciseDb();
  if (exDb.errors.length) exDb.errors.forEach((e) => console.log(`  ⚠️ ${e}`));
  printChunks('free-exercise-db', exDb.chunks);

  await sleep(300);

  // 2. wger API (first 20 exercises)
  console.log('\n2️⃣  wger API (categories + first 20 exercises)');
  const wger = await crawlWger();
  if (wger.errors.length) wger.errors.forEach((e) => console.log(`  ⚠️ ${e}`));
  printChunks('wger API', wger.chunks);

  await sleep(300);

  // 3. Breaking Muscle RSS (main feed only)
  console.log('\n3️⃣  Breaking Muscle RSS (main feed)');
  const bm = await crawlBreakingMuscleMain();
  if (bm.errors.length) bm.errors.forEach((e) => console.log(`  ⚠️ ${e}`));
  printChunks('Breaking Muscle RSS', bm.chunks);

  console.log(
    `\n✅ Dry run complete — ${exDb.chunks.length + wger.chunks.length + bm.chunks.length} total chunks produced, 0 written to DB\n`,
  );
}

main().catch(console.error);
