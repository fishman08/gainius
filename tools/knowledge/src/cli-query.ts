#!/usr/bin/env tsx
/**
 * CLI tool to query the knowledge database
 * Run: npm run query -- "strength training progressive overload"
 * Or:  npx tsx src/cli-query.ts "hypertrophy volume"
 */

import { queryKnowledge, getStats, closeDb } from './db.js';

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === '--help') {
    console.log(
      'Usage: npx tsx src/cli-query.ts <search terms> [--limit=N] [--quality=high|medium]',
    );
    console.log('\nExamples:');
    console.log('  npx tsx src/cli-query.ts "progressive overload hypertrophy"');
    console.log('  npx tsx src/cli-query.ts "HIIT cardio" --limit=3 --quality=high');
    console.log('  npx tsx src/cli-query.ts --stats');
    process.exit(0);
  }

  if (args[0] === '--stats') {
    const stats = getStats();
    console.log('\n📊 Knowledge Database Stats\n');
    console.log(`Total chunks: ${stats.total}`);
    console.log('\nBy source:');
    for (const [src, count] of Object.entries(stats.bySrc).sort((a, b) => b[1] - a[1])) {
      console.log(`  ${src}: ${count}`);
    }
    console.log('\nBy evidence quality:');
    for (const [quality, count] of Object.entries(stats.byQuality)) {
      console.log(`  ${quality}: ${count}`);
    }
    closeDb();
    return;
  }

  // Parse options
  const limitArg = args.find((a) => a.startsWith('--limit='));
  const qualityArg = args.find((a) => a.startsWith('--quality='));
  const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : 5;
  const quality = qualityArg?.split('=')[1] as 'high' | 'medium' | undefined;

  // Everything that's not an option is a search term
  const searchTerms = args
    .filter((a) => !a.startsWith('--'))
    .join(' ')
    .split(/\s+/)
    .filter((t) => t.length >= 3);

  if (searchTerms.length === 0) {
    console.log('No valid search terms (minimum 3 characters each)');
    process.exit(1);
  }

  console.log(
    `\n🔍 Searching: ${searchTerms.join(', ')} (limit=${limit}, quality=${quality ?? 'all'})\n`,
  );

  const results = queryKnowledge(searchTerms, limit, quality);

  if (results.length === 0) {
    console.log('No results found. Try broader search terms or run "npm run refresh" first.\n');
  } else {
    for (const chunk of results) {
      console.log(`📖 ${chunk.title}`);
      console.log(`   Source: ${chunk.source} | Quality: ${chunk.evidence_quality}`);
      console.log(`   Categories: ${chunk.categories.join(', ')}`);
      console.log(`   URL: ${chunk.url}`);
      console.log(`   Content: ${chunk.content.slice(0, 200)}...`);
      console.log();
    }
  }

  closeDb();
}

main();
