#!/usr/bin/env tsx
/**
 * Refresh knowledge database
 * Run: npm run refresh (or: npx tsx src/refresh.ts)
 *
 * Crawls all enabled sources and upserts into fitness_knowledge.db
 */

import { upsertChunks, getStats, closeDb } from './db.js';
import { crawlPubMed } from './crawlers/pubmed.js';
import { crawlFreeExerciseDb } from './crawlers/free-exercise-db.js';
import { crawlAllRss } from './crawlers/rss.js';
import { crawlPhysiopedia } from './crawlers/physiopedia.js';
import { crawlHtmlSources } from './crawlers/html.js';
import { crawlRedditWikis } from './crawlers/reddit.js';
import type { CrawlerResult } from './types.js';

interface CrawlerEntry {
  name: string;
  crawler: () => Promise<CrawlerResult>;
  tier: 1 | 2 | 3;
}

const CRAWLERS: CrawlerEntry[] = [
  // Tier 1: APIs + JSON
  { name: 'PubMed', crawler: crawlPubMed, tier: 1 },
  { name: 'free-exercise-db', crawler: crawlFreeExerciseDb, tier: 1 },
  { name: 'Physiopedia', crawler: crawlPhysiopedia, tier: 1 },

  // Tier 2: RSS + community wikis
  { name: 'RSS feeds', crawler: crawlAllRss, tier: 2 },
  { name: 'Reddit wikis', crawler: crawlRedditWikis, tier: 2 },

  // Tier 3: HTML scraping
  { name: 'HTML sources', crawler: crawlHtmlSources, tier: 3 },
];

async function main() {
  const args = process.argv.slice(2);
  const tierFilter = args.find((a) => a.startsWith('--tier='));
  const maxTier = tierFilter ? parseInt(tierFilter.split('=')[1], 10) : 3;
  const sourceFilter = args.find((a) => a.startsWith('--source='));
  const sourceOnly = sourceFilter?.split('=')[1]?.toLowerCase();

  console.log('\n📚 FITNESS KNOWLEDGE REFRESH');
  console.log('='.repeat(60));
  console.log(`Max tier: ${maxTier} | ${new Date().toISOString()}\n`);

  const results: { name: string; fetched: number; errors: number }[] = [];

  for (const entry of CRAWLERS) {
    if (entry.tier > maxTier) continue;
    if (sourceOnly && !entry.name.toLowerCase().includes(sourceOnly)) continue;

    console.log(`\n🔍 [Tier ${entry.tier}] ${entry.name}`);
    console.log('-'.repeat(40));

    try {
      const start = Date.now();
      const result = await entry.crawler();
      const elapsed = ((Date.now() - start) / 1000).toFixed(1);

      if (result.chunks.length > 0) {
        const upserted = upsertChunks(result.chunks);
        console.log(`  ✅ ${upserted} chunks upserted in ${elapsed}s`);
      } else {
        console.log(`  ⚠️ No chunks fetched (${elapsed}s)`);
      }

      if (result.errors.length > 0) {
        console.log(`  ⚠️ ${result.errors.length} errors:`);
        result.errors.slice(0, 5).forEach((e) => console.log(`    - ${e}`));
        if (result.errors.length > 5) console.log(`    ... and ${result.errors.length - 5} more`);
      }

      results.push({ name: entry.name, fetched: result.fetched, errors: result.errors.length });
    } catch (e) {
      console.log(`  ❌ Crawler crashed: ${(e as Error).message}`);
      results.push({ name: entry.name, fetched: 0, errors: 1 });
    }
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 REFRESH SUMMARY\n');

  const stats = getStats();
  console.log(`Total chunks in DB: ${stats.total}`);
  console.log('\nBy source:');
  for (const [src, count] of Object.entries(stats.bySrc).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${src}: ${count}`);
  }
  console.log('\nBy evidence quality:');
  for (const [quality, count] of Object.entries(stats.byQuality)) {
    console.log(`  ${quality}: ${count}`);
  }

  console.log('\nCrawler results:');
  for (const r of results) {
    const status = r.errors > 0 ? '⚠️' : '✅';
    console.log(`  ${status} ${r.name}: ${r.fetched} fetched, ${r.errors} errors`);
  }

  closeDb();
  console.log('\n✅ Done\n');
}

main().catch((e) => {
  console.error('Fatal error:', e);
  closeDb();
  process.exit(1);
});
