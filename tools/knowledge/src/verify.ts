#!/usr/bin/env tsx
import { getDb, closeDb } from './db.js';

const db = getDb();

// 1. Reddit chunks — community_validated tag check
const reddit = db
  .prepare("SELECT id, title, tags FROM knowledge_chunks WHERE source LIKE 'Reddit%' LIMIT 3")
  .all() as any[];
console.log('=== Reddit chunks (community_validated tag check) ===');
for (const r of reddit) {
  console.log(r.title);
  console.log('  tags:', r.tags);
  console.log();
}

// 2. Breaking Muscle — HTML entity check
const bm = db
  .prepare("SELECT content FROM knowledge_chunks WHERE source = 'Breaking Muscle' LIMIT 1")
  .get() as any;
console.log('=== Breaking Muscle entity check ===');
const snippet = bm.content.slice(0, 300);
const hasEntities = /&#\d+;|&nbsp;|&amp;|&lt;|&gt;/.test(snippet);
console.log('First 300 chars:', snippet);
console.log('Has raw HTML entities:', hasEntities);

// 3. Breaking Muscle — derived categories (should vary per article)
const bmCats = db
  .prepare(
    "SELECT title, categories FROM knowledge_chunks WHERE source = 'Breaking Muscle' LIMIT 5",
  )
  .all() as any[];
console.log('\n=== Breaking Muscle derived categories ===');
for (const r of bmCats) {
  console.log(`  ${r.title}`);
  console.log(`    → ${r.categories}`);
}

closeDb();
