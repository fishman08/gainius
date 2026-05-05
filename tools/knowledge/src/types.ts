export interface KnowledgeChunk {
  id: string;
  source: string;
  title: string;
  content: string; // max ~1500 tokens (~6000 chars)
  categories: string[];
  evidence_quality: 'high' | 'medium' | 'low';
  url: string;
  fetched_at: string;
  tags: string[];
}

export interface CrawlerResult {
  chunks: KnowledgeChunk[];
  source: string;
  fetched: number;
  errors: string[];
}

export interface SourceConfig {
  name: string;
  enabled: boolean;
  crawler: () => Promise<CrawlerResult>;
}
