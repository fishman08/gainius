export interface KnowledgeEntry {
  id: string;
  title: string;
  source: string;
  content: string; // truncated to 800 chars
  categories: string[];
  tags: string[];
  evidence_quality: 'high' | 'medium' | 'low';
}

export interface KnowledgeIndex {
  totalDocs: number;
  df: Record<string, number>; // document frequency per term
  postings: Record<string, [number, number][]>; // term → [entryIndex, tfidfScore][]
}
