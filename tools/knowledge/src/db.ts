import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import type { KnowledgeChunk } from './types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_DB_PATH = path.resolve(__dirname, '..', 'fitness_knowledge.db');

let _db: Database.Database | null = null;

export function getDb(dbPath = DEFAULT_DB_PATH): Database.Database {
  if (_db) return _db;

  _db = new Database(dbPath);
  _db.pragma('journal_mode = WAL');

  // Main table
  _db.exec(`
    CREATE TABLE IF NOT EXISTS knowledge_chunks (
      id TEXT PRIMARY KEY,
      source TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      categories TEXT NOT NULL,  -- JSON array
      evidence_quality TEXT NOT NULL CHECK(evidence_quality IN ('high', 'medium', 'low')),
      url TEXT NOT NULL,
      fetched_at TEXT NOT NULL,
      tags TEXT NOT NULL          -- JSON array
    )
  `);

  // FTS5 virtual table
  _db.exec(`
    CREATE VIRTUAL TABLE IF NOT EXISTS knowledge_fts USING fts5(
      title, content, tags, categories,
      content=knowledge_chunks,
      content_rowid=rowid,
      tokenize='porter unicode61'
    )
  `);

  // Triggers to keep FTS in sync
  _db.exec(`
    CREATE TRIGGER IF NOT EXISTS knowledge_ai AFTER INSERT ON knowledge_chunks BEGIN
      INSERT INTO knowledge_fts(rowid, title, content, tags, categories)
      VALUES (new.rowid, new.title, new.content, new.tags, new.categories);
    END
  `);
  _db.exec(`
    CREATE TRIGGER IF NOT EXISTS knowledge_ad AFTER DELETE ON knowledge_chunks BEGIN
      INSERT INTO knowledge_fts(knowledge_fts, rowid, title, content, tags, categories)
      VALUES ('delete', old.rowid, old.title, old.content, old.tags, old.categories);
    END
  `);
  _db.exec(`
    CREATE TRIGGER IF NOT EXISTS knowledge_au AFTER UPDATE ON knowledge_chunks BEGIN
      INSERT INTO knowledge_fts(knowledge_fts, rowid, title, content, tags, categories)
      VALUES ('delete', old.rowid, old.title, old.content, old.tags, old.categories);
      INSERT INTO knowledge_fts(rowid, title, content, tags, categories)
      VALUES (new.rowid, new.title, new.content, new.tags, new.categories);
    END
  `);

  return _db;
}

export function upsertChunk(chunk: KnowledgeChunk): void {
  const db = getDb();
  db.prepare(
    `
    INSERT OR REPLACE INTO knowledge_chunks (id, source, title, content, categories, evidence_quality, url, fetched_at, tags)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `,
  ).run(
    chunk.id,
    chunk.source,
    chunk.title,
    chunk.content,
    JSON.stringify(chunk.categories),
    chunk.evidence_quality,
    chunk.url,
    chunk.fetched_at,
    JSON.stringify(chunk.tags),
  );
}

export function upsertChunks(chunks: KnowledgeChunk[]): number {
  const db = getDb();
  const insert = db.prepare(`
    INSERT OR REPLACE INTO knowledge_chunks (id, source, title, content, categories, evidence_quality, url, fetched_at, tags)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const tx = db.transaction((items: KnowledgeChunk[]) => {
    let count = 0;
    for (const c of items) {
      insert.run(
        c.id,
        c.source,
        c.title,
        c.content,
        JSON.stringify(c.categories),
        c.evidence_quality,
        c.url,
        c.fetched_at,
        JSON.stringify(c.tags),
      );
      count++;
    }
    return count;
  });

  return tx(chunks);
}

function rowToChunk(row: Record<string, unknown>): KnowledgeChunk {
  return {
    id: row.id as string,
    source: row.source as string,
    title: row.title as string,
    content: row.content as string,
    categories: JSON.parse(row.categories as string),
    evidence_quality: row.evidence_quality as KnowledgeChunk['evidence_quality'],
    url: row.url as string,
    fetched_at: row.fetched_at as string,
    tags: JSON.parse(row.tags as string),
  };
}

export function queryKnowledge(
  searchTerms: string[],
  limit = 5,
  evidenceFilter?: 'high' | 'medium',
): KnowledgeChunk[] {
  const db = getDb();

  // Build FTS5 query: OR-join all terms, each with * for prefix matching
  const ftsQuery = searchTerms
    .map((t) => t.trim().replace(/[^\w\s]/g, ''))
    .filter((t) => t.length >= 3)
    .map((t) => `"${t}"*`)
    .join(' OR ');

  if (!ftsQuery) return [];

  let sql = `
    SELECT kc.*, rank
    FROM knowledge_fts
    JOIN knowledge_chunks kc ON kc.rowid = knowledge_fts.rowid
    WHERE knowledge_fts MATCH ?
  `;
  const params: unknown[] = [ftsQuery];

  if (evidenceFilter) {
    if (evidenceFilter === 'high') {
      sql += ` AND kc.evidence_quality = 'high'`;
    } else {
      sql += ` AND kc.evidence_quality IN ('high', 'medium')`;
    }
  }

  sql += ` ORDER BY rank LIMIT ?`;
  params.push(limit);

  const rows = db.prepare(sql).all(...params) as Record<string, unknown>[];
  return rows.map(rowToChunk);
}

export function getStats(): {
  total: number;
  bySrc: Record<string, number>;
  byQuality: Record<string, number>;
} {
  const db = getDb();
  const total = (db.prepare('SELECT COUNT(*) as c FROM knowledge_chunks').get() as { c: number }).c;
  const srcRows = db
    .prepare('SELECT source, COUNT(*) as c FROM knowledge_chunks GROUP BY source')
    .all() as { source: string; c: number }[];
  const qualRows = db
    .prepare(
      'SELECT evidence_quality, COUNT(*) as c FROM knowledge_chunks GROUP BY evidence_quality',
    )
    .all() as { evidence_quality: string; c: number }[];

  const bySrc: Record<string, number> = {};
  for (const r of srcRows) bySrc[r.source] = r.c;
  const byQuality: Record<string, number> = {};
  for (const r of qualRows) byQuality[r.evidence_quality] = r.c;

  return { total, bySrc, byQuality };
}

export function closeDb(): void {
  if (_db) {
    _db.close();
    _db = null;
  }
}
