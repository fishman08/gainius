/**
 * Reddit wiki page crawler
 * Uses Reddit's .json endpoint which returns raw markdown — no API auth needed
 * All chunks tagged "community_validated" to distinguish from peer-reviewed content
 */

import { fetchText, sleep, makeId, truncate, decodeEntities, categorizeFromText } from '../http.js';
import type { KnowledgeChunk, CrawlerResult } from '../types.js';

interface WikiPage {
  url: string;
  subreddit: string;
  label: string;
  defaultCategories: string[];
}

const WIKI_PAGES: WikiPage[] = [
  {
    url: 'https://www.reddit.com/r/bodyweightfitness/wiki/kb/recommended_routine',
    subreddit: 'r/bodyweightfitness',
    label: 'Recommended Routine',
    defaultCategories: ['calisthenics_bodyweight', 'strength_hypertrophy'],
  },
  {
    url: 'https://www.reddit.com/r/bodyweightfitness/wiki/index',
    subreddit: 'r/bodyweightfitness',
    label: 'BWF Wiki Index & Progressions',
    defaultCategories: ['calisthenics_bodyweight', 'strength_hypertrophy'],
  },
  {
    url: 'https://www.reddit.com/r/weightroom/wiki/index',
    subreddit: 'r/weightroom',
    label: 'Weightroom Wiki',
    defaultCategories: ['strength_hypertrophy'],
  },
  {
    url: 'https://www.reddit.com/r/flexibility/wiki/index',
    subreddit: 'r/flexibility',
    label: 'Flexibility Wiki',
    defaultCategories: ['flexibility', 'mobility_recovery'],
  },
  {
    url: 'https://www.reddit.com/r/running/wiki/faq',
    subreddit: 'r/running',
    label: 'Running FAQ',
    defaultCategories: ['cardio_endurance'],
  },
];

interface RedditWikiResponse {
  kind: string;
  data: {
    content_md: string;
    content_html?: string;
  };
}

function stripMarkdownLinks(md: string): string {
  // [text](url) → text
  return md.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1');
}

function cleanMarkdown(md: string): string {
  return decodeEntities(
    stripMarkdownLinks(md)
      .replace(/^#{1,6}\s*/gm, '') // strip heading markers but keep text
      .replace(/\*\*([^*]+)\*\*/g, '$1') // bold → plain
      .replace(/\*([^*]+)\*/g, '$1') // italic → plain
      .replace(/`([^`]+)`/g, '$1') // inline code → plain
      .replace(/^[\s]*[-*+]\s/gm, '- ') // normalize bullets
      .replace(/\r\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim(),
  );
}

/**
 * Split large markdown into chunks at heading boundaries.
 * Keeps each chunk self-contained with its heading for context.
 */
function splitByHeadings(md: string, maxChars = 5500): string[] {
  if (md.length <= maxChars) return [md];

  // Split on markdown headings (## or ### lines)
  const parts = md.split(/(?=^#{1,3}\s)/m);
  const chunks: string[] = [];
  let current = '';

  for (const part of parts) {
    if (current.length + part.length > maxChars && current.length > 200) {
      chunks.push(current.trim());
      current = part;
    } else {
      current += (current ? '\n\n' : '') + part;
    }
  }

  if (current.trim().length > 100) {
    chunks.push(current.trim());
  }

  return chunks.length > 0 ? chunks : [md];
}

export async function crawlRedditWikis(): Promise<CrawlerResult> {
  const errors: string[] = [];
  const chunks: KnowledgeChunk[] = [];

  console.log('  [Reddit] Fetching wiki pages via .json endpoints...');

  for (const page of WIKI_PAGES) {
    try {
      const jsonUrl = `${page.url}.json`;
      console.log(`  [Reddit] ${page.subreddit} — ${page.label}`);

      const raw = await fetchText(jsonUrl, 15000);
      const data = JSON.parse(raw) as RedditWikiResponse;
      const markdown = data?.data?.content_md ?? '';

      if (markdown.length < 100) {
        errors.push(
          `${page.subreddit} ${page.label}: content too short (${markdown.length} chars)`,
        );
        continue;
      }

      // Split BEFORE cleaning so heading markers are still present for boundary detection
      const sections = splitByHeadings(markdown).map(cleanMarkdown);

      for (let i = 0; i < sections.length; i++) {
        const section = sections[i];
        const suffix = sections.length > 1 ? ` (part ${i + 1}/${sections.length})` : '';
        const title = `${page.subreddit} — ${page.label}${suffix}`;

        const derivedCategories = categorizeFromText(title, section, page.defaultCategories);
        const categories = [...new Set([...derivedCategories, ...page.defaultCategories])];

        chunks.push({
          id: makeId('reddit', `${page.url}#${i}`),
          source: `Reddit ${page.subreddit}`,
          title,
          content: truncate(section),
          categories,
          evidence_quality: 'medium',
          url: page.url,
          fetched_at: new Date().toISOString(),
          tags: ['community_validated', page.subreddit.replace('r/', ''), page.label.toLowerCase()],
        });
      }

      console.log(
        `  [Reddit] ${page.subreddit} → ${sections.length} chunk(s), ${markdown.length} chars raw`,
      );
      await sleep(2000); // Be extra polite to Reddit
    } catch (e) {
      errors.push(`Reddit ${page.subreddit} ${page.label} failed: ${(e as Error).message}`);
    }
  }

  return { chunks, source: 'Reddit wikis', fetched: chunks.length, errors };
}
