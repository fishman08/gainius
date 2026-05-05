/**
 * Generic RSS/Atom feed crawler
 * Handles: Breaking Muscle, Stronger By Science, Renaissance Periodization,
 *          Squat University, HIIT Science, Uphill Athlete, Science for Sport
 *
 * Breaking Muscle: fetches full article HTML for each RSS item
 * Others: uses RSS content/description (usually sufficient)
 */

import { XMLParser } from 'fast-xml-parser';
import { fetchText, sleep, makeId, truncate, stripHtml, categorizeFromText } from '../http.js';
import type { KnowledgeChunk, CrawlerResult } from '../types.js';

interface FeedSource {
  name: string;
  sourceId: string;
  urls: string[];
  defaultCategories: string[]; // fallback only
  evidence_quality: 'high' | 'medium' | 'low';
  fetchFullArticle?: boolean;
}

const RSS_SOURCES: FeedSource[] = [
  {
    name: 'Breaking Muscle',
    sourceId: 'breaking-muscle',
    urls: ['https://breakingmuscle.com/feed/rss'],
    defaultCategories: ['strength_hypertrophy'],
    evidence_quality: 'medium',
    fetchFullArticle: true,
  },
  {
    name: 'Stronger By Science',
    sourceId: 'stronger-by-science',
    urls: ['https://www.strongerbyscience.com/feed/'],
    defaultCategories: ['strength_hypertrophy'],
    evidence_quality: 'high',
  },
  {
    name: 'Renaissance Periodization',
    sourceId: 'renaissance-periodization',
    urls: ['https://rpstrength.com/blogs/articles.atom'],
    defaultCategories: ['strength_hypertrophy'],
    evidence_quality: 'high',
  },
  {
    name: 'Squat University',
    sourceId: 'squat-university',
    urls: ['https://squatuniversity.com/feed/'],
    defaultCategories: ['mobility_recovery', 'rehab_injury_prevention'],
    evidence_quality: 'high',
  },
  {
    name: 'HIIT Science',
    sourceId: 'hiit-science',
    urls: ['https://hiitscience.com/feed/'],
    defaultCategories: ['hiit_conditioning', 'cardio_endurance'],
    evidence_quality: 'high',
  },
  {
    name: 'Uphill Athlete',
    sourceId: 'uphill-athlete',
    urls: ['https://uphillathlete.com/feed/'],
    defaultCategories: ['cardio_endurance'],
    evidence_quality: 'high',
  },
  {
    name: 'Science for Sport',
    sourceId: 'science-for-sport',
    urls: ['https://scienceforsport.com/feed'],
    defaultCategories: ['strength_hypertrophy', 'sport_specific'],
    evidence_quality: 'high',
  },
];

interface ParsedItem {
  title: string;
  link: string;
  description: string;
  pubDate?: string;
  feedCategories: string[];
}

function parseFeed(xml: string): ParsedItem[] {
  const parser = new XMLParser({
    ignoreAttributes: false,
    isArray: (name) => name === 'item' || name === 'entry' || name === 'category',
  });
  const parsed = parser.parse(xml);

  // RSS 2.0
  const rssItems = parsed?.rss?.channel?.item ?? [];
  if (Array.isArray(rssItems) && rssItems.length > 0) {
    return rssItems.map((item: Record<string, unknown>) => ({
      title: stripHtml(String(item.title ?? '')),
      link: String(item.link ?? ''),
      description: stripHtml(String(item['content:encoded'] ?? item.description ?? '')),
      pubDate: String(item.pubDate ?? ''),
      feedCategories: Array.isArray(item.category)
        ? item.category.map((c: unknown) =>
            String(
              typeof c === 'object' && c !== null
                ? ((c as Record<string, unknown>)['#text'] ?? c)
                : c,
            ),
          )
        : item.category
          ? [String(item.category)]
          : [],
    }));
  }

  // Atom
  const atomEntries = parsed?.feed?.entry ?? [];
  if (Array.isArray(atomEntries) && atomEntries.length > 0) {
    return atomEntries.map((entry: Record<string, unknown>) => {
      let link = '';
      if (typeof entry.link === 'string') {
        link = entry.link;
      } else if (typeof entry.link === 'object' && entry.link !== null) {
        link = String((entry.link as Record<string, unknown>)['@_href'] ?? '');
      }
      const content = entry.content ?? entry.summary ?? '';
      const contentStr =
        typeof content === 'object' && content !== null
          ? String((content as Record<string, unknown>)['#text'] ?? '')
          : String(content);

      return {
        title: stripHtml(String(entry.title ?? '')),
        link,
        description: stripHtml(contentStr),
        pubDate: String(entry.published ?? entry.updated ?? ''),
        feedCategories: Array.isArray(entry.category)
          ? entry.category.map((c: unknown) => {
              if (typeof c === 'object' && c !== null)
                return String((c as Record<string, unknown>)['@_term'] ?? '');
              return String(c);
            })
          : [],
      };
    });
  }

  return [];
}

function extractArticleBody(html: string): string {
  const match =
    html.match(/<article[^>]*>([\s\S]*?)<\/article>/i) ??
    html.match(
      /<div[^>]*class="[^"]*(?:entry-content|post-content|article-body|blog-content|single-content)[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    ) ??
    html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);

  return stripHtml(match ? (match[1] ?? match[0]) : html);
}

async function crawlSingleSource(
  source: FeedSource,
): Promise<{ chunks: KnowledgeChunk[]; errors: string[] }> {
  const chunks: KnowledgeChunk[] = [];
  const errors: string[] = [];
  const seenLinks = new Set<string>();

  for (const feedUrl of source.urls) {
    try {
      const xml = await fetchText(feedUrl, 12000);
      const items = parseFeed(xml);

      for (const item of items) {
        if (!item.title || seenLinks.has(item.link)) continue;
        seenLinks.add(item.link);

        let content = item.description;

        // Fetch full article HTML for sources that only provide teasers
        if (source.fetchFullArticle && item.link) {
          try {
            const articleHtml = await fetchText(item.link, 12000);
            const fullContent = extractArticleBody(articleHtml);
            if (fullContent.length > content.length) {
              content = fullContent;
            }
            await sleep(500);
          } catch (e) {
            errors.push(
              `${source.name} article fetch ${item.link} failed: ${(e as Error).message}`,
            );
            // Fall back to RSS description
          }
        }

        if (content.length < 50) continue;

        // Remove trailing "The post ... appeared first on ..." boilerplate
        content = content
          .replace(/\s*The post .{1,100} appeared first on .{1,60}\.\s*$/, '')
          .trim();

        // Derive categories from content + feed tags, not source config
        const derivedCategories = categorizeFromText(item.title, content, item.feedCategories);

        const tags = [...item.feedCategories].filter((t, i, arr) => t && arr.indexOf(t) === i);

        chunks.push({
          id: makeId(source.sourceId, item.link || item.title),
          source: source.name,
          title: truncate(item.title, 300),
          content: truncate(content),
          categories: derivedCategories,
          evidence_quality: source.evidence_quality,
          url: item.link,
          fetched_at: new Date().toISOString(),
          tags,
        });
      }

      console.log(
        `  [${source.name}] ${feedUrl.split('/').pop()} → ${items.length} items, ${chunks.length} chunks`,
      );
    } catch (e) {
      errors.push(`${source.name} feed ${feedUrl} failed: ${(e as Error).message}`);
    }

    await sleep(400);
  }

  return { chunks, errors };
}

export async function crawlAllRss(): Promise<CrawlerResult> {
  const allChunks: KnowledgeChunk[] = [];
  const allErrors: string[] = [];

  for (const source of RSS_SOURCES) {
    console.log(`  [RSS] Crawling ${source.name}...`);
    const { chunks, errors } = await crawlSingleSource(source);
    allChunks.push(...chunks);
    allErrors.push(...errors);
    await sleep(500);
  }

  return {
    chunks: allChunks,
    source: 'RSS feeds',
    fetched: allChunks.length,
    errors: allErrors,
  };
}
