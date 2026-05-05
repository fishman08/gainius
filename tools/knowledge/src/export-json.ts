/**
 * Export knowledge DB to static JSON files for in-app use.
 * Generates:
 *   - packages/shared/src/data/knowledgeData.json  (KnowledgeEntry[])
 *   - packages/shared/src/data/knowledgeIndex.json  (inverted index for TF-IDF search)
 */

import { getDb, closeDb } from './db.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Import stemmer from shared package (relative path since it's TS source)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sharedDataDir = path.resolve(__dirname, '../../../packages/shared/src/data');

// Inline tokenize to avoid TS import issues from a different package
function porterStemInline(w: string): string {
  // Minimal inline — we use the same algorithm as porterStemmer.ts
  // For the export script, we import dynamically
  return w; // placeholder, replaced below
}

// Dynamic import of the shared stemmer
async function loadStemmer(): Promise<{ tokenize: (text: string) => string[] }> {
  // Use tsx to resolve the TS file directly
  const stemmerPath = path.resolve(sharedDataDir, 'porterStemmer.ts');
  const mod = await import(stemmerPath);
  return { tokenize: mod.tokenize };
}

interface DbRow {
  id: string;
  source: string;
  title: string;
  content: string;
  categories: string;
  tags: string;
  evidence_quality: string;
}

interface KnowledgeEntry {
  id: string;
  title: string;
  source: string;
  content: string;
  categories: string[];
  tags: string[];
  evidence_quality: 'high' | 'medium' | 'low';
}

function truncate(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  const cut = text.lastIndexOf(' ', maxChars);
  return text.slice(0, cut > 0 ? cut : maxChars);
}

async function main() {
  const { tokenize } = await loadStemmer();
  const db = getDb();

  // Read all chunks
  const rows = db
    .prepare(
      'SELECT id, source, title, content, categories, tags, evidence_quality FROM knowledge_chunks',
    )
    .all() as DbRow[];
  console.log(`Read ${rows.length} chunks from DB`);

  // Build entries (drop url, fetched_at; truncate content)
  const entries: KnowledgeEntry[] = rows.map((row) => ({
    id: row.id,
    title: row.title,
    source: row.source,
    content: truncate(row.content, 800),
    categories: JSON.parse(row.categories),
    tags: JSON.parse(row.tags),
    evidence_quality: row.evidence_quality as KnowledgeEntry['evidence_quality'],
  }));

  // Build inverted index with TF-IDF
  // Step 1: Compute term frequencies per document
  const docTermFreqs: Map<string, number>[] = []; // per-entry term→count
  const docFreq = new Map<string, number>(); // term → number of docs containing it

  for (const entry of entries) {
    const termCounts = new Map<string, number>();

    // Weight: title 3x, tags 2x, categories 2x, content 1x
    const titleTerms = tokenize(entry.title);
    const tagTerms = entry.tags.flatMap((t) => tokenize(t));
    const catTerms = entry.categories.flatMap((c) => tokenize(c));
    const contentTerms = tokenize(entry.content);

    for (const t of titleTerms) termCounts.set(t, (termCounts.get(t) ?? 0) + 3);
    for (const t of tagTerms) termCounts.set(t, (termCounts.get(t) ?? 0) + 2);
    for (const t of catTerms) termCounts.set(t, (termCounts.get(t) ?? 0) + 2);
    for (const t of contentTerms) termCounts.set(t, (termCounts.get(t) ?? 0) + 1);

    docTermFreqs.push(termCounts);

    for (const term of termCounts.keys()) {
      docFreq.set(term, (docFreq.get(term) ?? 0) + 1);
    }
  }

  // Step 2: Compute TF-IDF and build postings
  const totalDocs = entries.length;
  const postings: Record<string, [number, number][]> = {};
  const dfRecord: Record<string, number> = {};

  for (const [term, df] of docFreq.entries()) {
    dfRecord[term] = df;
    const idf = Math.log(totalDocs / df);
    const termPostings: [number, number][] = [];

    for (let i = 0; i < docTermFreqs.length; i++) {
      const tf = docTermFreqs[i].get(term);
      if (tf) {
        const tfidf = Math.round(tf * idf * 100) / 100; // 2 decimal places
        termPostings.push([i, tfidf]);
      }
    }

    // Sort by score descending for faster retrieval
    termPostings.sort((a, b) => b[1] - a[1]);
    postings[term] = termPostings;
  }

  const index = { totalDocs, df: dfRecord, postings };

  // Write files
  fs.mkdirSync(sharedDataDir, { recursive: true });

  const dataPath = path.join(sharedDataDir, 'knowledgeData.json');
  const indexPath = path.join(sharedDataDir, 'knowledgeIndex.json');

  fs.writeFileSync(dataPath, JSON.stringify(entries));
  fs.writeFileSync(indexPath, JSON.stringify(index));

  const dataSize = (fs.statSync(dataPath).size / 1024).toFixed(0);
  const indexSize = (fs.statSync(indexPath).size / 1024).toFixed(0);

  console.log(`Written ${entries.length} entries to knowledgeData.json (${dataSize}KB)`);
  console.log(
    `Written index with ${Object.keys(postings).length} terms to knowledgeIndex.json (${indexSize}KB)`,
  );

  closeDb();
}

main().catch((err) => {
  console.error('Export failed:', err);
  process.exit(1);
});
