import type { KnowledgeSnippet } from '../api/contextBuilder';
import type { KnowledgeEntry, KnowledgeIndex } from './knowledgeTypes';
import { tokenize } from './porterStemmer';
import knowledgeDataJson from './knowledgeData.json';
import knowledgeIndexJson from './knowledgeIndex.json';

const _entries = knowledgeDataJson as unknown as KnowledgeEntry[];
const _index = knowledgeIndexJson as unknown as KnowledgeIndex;

function getEntries(): KnowledgeEntry[] {
  return _entries;
}

function getIndex(): KnowledgeIndex {
  return _index;
}

export interface SearchOptions {
  limit?: number; // default 5
  evidenceFilter?: 'high' | 'medium';
  exerciseNames?: string[]; // boost results matching current plan exercises
}

export function searchKnowledge(query: string, options?: SearchOptions): KnowledgeSnippet[] {
  const entries = getEntries();
  const index = getIndex();
  const limit = options?.limit ?? 5;

  const queryTerms = tokenize(query);
  if (queryTerms.length === 0) return [];

  // Sum TF-IDF scores per entry across all query terms
  const scores = new Map<number, number>();

  for (const term of queryTerms) {
    const termPostings = index.postings[term];
    if (!termPostings) continue;

    for (const [entryIdx, tfidf] of termPostings) {
      scores.set(entryIdx, (scores.get(entryIdx) ?? 0) + tfidf);
    }
  }

  // Bonus for matching exercise names
  if (options?.exerciseNames && options.exerciseNames.length > 0) {
    const lowerNames = options.exerciseNames.map((n) => n.toLowerCase());
    for (const [entryIdx, score] of scores.entries()) {
      const entry = entries[entryIdx];
      const titleLower = entry.title.toLowerCase();
      const tagsLower = entry.tags.map((t) => t.toLowerCase());
      const matches = lowerNames.some(
        (name) =>
          titleLower.includes(name) ||
          name.includes(titleLower) ||
          tagsLower.some((tag) => tag.includes(name) || name.includes(tag)),
      );
      if (matches) scores.set(entryIdx, score + 2.0);
    }
  }

  // Filter by evidence quality
  let candidates = [...scores.entries()];
  if (options?.evidenceFilter) {
    const allowed =
      options.evidenceFilter === 'high' ? new Set(['high']) : new Set(['high', 'medium']);
    candidates = candidates.filter(([idx]) => allowed.has(entries[idx].evidence_quality));
  }

  // Sort descending by score, take top limit
  candidates.sort((a, b) => b[1] - a[1]);
  const topEntries = candidates.slice(0, limit);

  return topEntries.map(([idx]) => {
    const entry = entries[idx];
    return {
      title: entry.title,
      source: entry.source,
      content: entry.content,
      evidence_quality: entry.evidence_quality,
    };
  });
}
