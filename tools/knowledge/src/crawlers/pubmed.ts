/**
 * PubMed E-utilities crawler
 * Uses ESearch → EFetch workflow to get exercise science abstracts
 * Free: 3 req/sec without API key, 10 req/sec with NCBI key
 */

import { XMLParser } from 'fast-xml-parser';
import { fetchJson, fetchText, sleep, makeId, truncate } from '../http.js';
import type { KnowledgeChunk, CrawlerResult } from '../types.js';

const EUTILS_BASE = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';

// MeSH search queries covering major training domains
const SEARCH_QUERIES = [
  'resistance+training[MeSH]+AND+(muscle+hypertrophy+OR+strength+training)',
  'high+intensity+interval+training[MeSH]',
  'exercise[MeSH]+AND+recovery[MeSH]+AND+muscle',
  'stretching+exercise[MeSH]+AND+flexibility',
  'progressive+overload+AND+resistance+exercise',
  'periodization+AND+strength+training',
  'aerobic+exercise[MeSH]+AND+endurance',
  'exercise+AND+injury+prevention[MeSH]',
];

const RESULTS_PER_QUERY = 15;

interface ESearchResult {
  esearchresult: {
    idlist: string[];
    count: string;
  };
}

async function searchPubMed(query: string): Promise<string[]> {
  const url = `${EUTILS_BASE}/esearch.fcgi?db=pubmed&term=${query}&retmax=${RESULTS_PER_QUERY}&retmode=json&sort=relevance`;
  const result = await fetchJson<ESearchResult>(url);
  return result.esearchresult.idlist ?? [];
}

async function fetchAbstracts(pmids: string[]): Promise<KnowledgeChunk[]> {
  if (pmids.length === 0) return [];

  const url = `${EUTILS_BASE}/efetch.fcgi?db=pubmed&id=${pmids.join(',')}&rettype=abstract&retmode=xml`;
  const xml = await fetchText(url, 15000);

  const parser = new XMLParser({
    ignoreAttributes: false,
    isArray: (name) =>
      name === 'PubmedArticle' || name === 'AbstractText' || name === 'MeshHeading',
  });
  const parsed = parser.parse(xml);

  const articles = parsed?.PubmedArticleSet?.PubmedArticle ?? [];
  const chunks: KnowledgeChunk[] = [];

  for (const article of articles) {
    try {
      const medline = article.MedlineCitation;
      const pmid = String(medline?.PMID?.['#text'] ?? medline?.PMID ?? '');
      if (!pmid) continue;

      const articleData = medline?.Article;
      const title =
        typeof articleData?.ArticleTitle === 'string'
          ? articleData.ArticleTitle
          : (articleData?.ArticleTitle?.['#text'] ?? '');

      // Extract abstract text
      const abstractTexts = articleData?.Abstract?.AbstractText ?? [];
      let abstractContent: string;
      if (typeof abstractTexts === 'string') {
        abstractContent = abstractTexts;
      } else if (Array.isArray(abstractTexts)) {
        abstractContent = abstractTexts
          .map((t: unknown) => {
            if (typeof t === 'string') return t;
            if (typeof t === 'object' && t !== null) {
              const obj = t as Record<string, unknown>;
              const label = obj['@_Label'] ?? '';
              const text = obj['#text'] ?? '';
              return label ? `${label}: ${text}` : String(text);
            }
            return '';
          })
          .filter(Boolean)
          .join('\n\n');
      } else if (typeof abstractTexts === 'object' && abstractTexts !== null) {
        const obj = abstractTexts as Record<string, unknown>;
        abstractContent = String(obj['#text'] ?? '');
      } else {
        abstractContent = '';
      }

      if (!abstractContent || abstractContent.length < 100) continue;

      // Extract MeSH tags
      const meshHeadings = medline?.MeshHeadingList?.MeshHeading ?? [];
      const tags = Array.isArray(meshHeadings)
        ? meshHeadings
            .map((m: Record<string, unknown>) => {
              const desc = m.DescriptorName;
              if (typeof desc === 'string') return desc;
              if (typeof desc === 'object' && desc !== null)
                return String((desc as Record<string, unknown>)['#text'] ?? '');
              return '';
            })
            .filter(Boolean)
            .slice(0, 10)
        : [];

      // Map to fitness categories
      const categories = categorizePubMed(title, abstractContent, tags);

      chunks.push({
        id: makeId('pubmed', pmid),
        source: 'PubMed',
        title: truncate(title, 300),
        content: truncate(abstractContent),
        categories,
        evidence_quality: 'high',
        url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
        fetched_at: new Date().toISOString(),
        tags,
      });
    } catch {
      // Skip malformed articles
    }
  }

  return chunks;
}

function categorizePubMed(title: string, content: string, tags: string[]): string[] {
  const text = `${title} ${content} ${tags.join(' ')}`.toLowerCase();
  const cats: string[] = [];

  if (
    /resistance.training|hypertrophy|strength.training|weight.training|progressive.overload|periodization/.test(
      text,
    )
  )
    cats.push('strength_hypertrophy');
  if (/aerobic|endurance|cardio|vo2|running|cycling/.test(text)) cats.push('cardio_endurance');
  if (/recovery|sleep|overtraining|deload|rest/.test(text)) cats.push('mobility_recovery');
  if (/hiit|high.intensity.interval|tabata|sprint.interval/.test(text))
    cats.push('hiit_conditioning');
  if (/flexibility|stretching|range.of.motion|mobility/.test(text)) cats.push('flexibility');
  if (/injury|prevention|rehabilitation|rehab/.test(text)) cats.push('rehab_injury_prevention');
  if (/bodyweight|calisthen/.test(text)) cats.push('calisthenics_bodyweight');
  if (/nutrition|protein|supplement|creatine|caffeine/.test(text))
    cats.push('nutrition_performance');

  return cats.length > 0 ? cats : ['strength_hypertrophy'];
}

export async function crawlPubMed(): Promise<CrawlerResult> {
  const errors: string[] = [];
  const allChunks: KnowledgeChunk[] = [];
  const seenPmids = new Set<string>();

  console.log('  [PubMed] Running searches...');

  for (const query of SEARCH_QUERIES) {
    try {
      const pmids = await searchPubMed(query);
      const newPmids = pmids.filter((id) => !seenPmids.has(id));
      newPmids.forEach((id) => seenPmids.add(id));

      if (newPmids.length > 0) {
        await sleep(350); // Rate limit: ~3 req/sec
        const chunks = await fetchAbstracts(newPmids);
        allChunks.push(...chunks);
        console.log(`  [PubMed] Query "${query.slice(0, 40)}..." → ${chunks.length} abstracts`);
      }

      await sleep(350);
    } catch (e) {
      errors.push(`PubMed search failed: ${(e as Error).message}`);
    }
  }

  return {
    chunks: allChunks,
    source: 'PubMed',
    fetched: allChunks.length,
    errors,
  };
}
