/**
 * Physiopedia MediaWiki API crawler
 * Free open-access physical therapy encyclopedia
 */

import { fetchJson, sleep, makeId, truncate } from '../http.js';
import type { KnowledgeChunk, CrawlerResult } from '../types.js';

const API_BASE = 'https://www.physio-pedia.com/api.php';

// Key categories for exercise/rehab content
const CATEGORIES = [
  'Therapeutic_Exercise',
  'Stretching',
  'Strength_Training',
  'Balance_Training',
  'Cardiovascular_Training',
  'Core_Stability',
  'Flexibility',
  'Injury_Prevention',
];

interface CategoryMember {
  pageid: number;
  title: string;
}

interface CategoryResponse {
  query?: {
    categorymembers?: CategoryMember[];
  };
}

interface ParseResponse {
  parse?: {
    title: string;
    pageid: number;
    text: { '*': string };
  };
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<ref[^>]*>[\s\S]*?<\/ref>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\[edit\]/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function categorize(title: string, content: string): string[] {
  const text = `${title} ${content}`.toLowerCase();
  const cats: string[] = [];

  if (/stretch|flexibility|range.of.motion/.test(text)) cats.push('flexibility');
  if (/strength|resistance|weight/.test(text)) cats.push('strength_hypertrophy');
  if (/cardio|aerobic|endurance/.test(text)) cats.push('cardio_endurance');
  if (/balance|stability|core/.test(text)) cats.push('mobility_recovery');
  if (/injury|prevention|rehab|rehabilitation/.test(text)) cats.push('rehab_injury_prevention');

  return cats.length > 0 ? cats : ['rehab_injury_prevention'];
}

export async function crawlPhysiopedia(): Promise<CrawlerResult> {
  const errors: string[] = [];
  const chunks: KnowledgeChunk[] = [];
  const seenPages = new Set<number>();

  console.log('  [Physiopedia] Fetching category members...');

  // Collect page titles from all categories
  const pagesToFetch: CategoryMember[] = [];

  for (const category of CATEGORIES) {
    try {
      const url = `${API_BASE}?action=query&list=categorymembers&cmtitle=Category:${category}&format=json&cmlimit=30`;
      const res = await fetchJson<CategoryResponse>(url, 10000);
      const members = res.query?.categorymembers ?? [];

      for (const member of members) {
        if (!seenPages.has(member.pageid)) {
          seenPages.add(member.pageid);
          pagesToFetch.push(member);
        }
      }

      console.log(`  [Physiopedia] Category:${category} → ${members.length} pages`);
      await sleep(500);
    } catch (e) {
      errors.push(`Physiopedia category ${category} failed: ${(e as Error).message}`);
    }
  }

  // Fetch and parse each page (limit to 80 pages to be respectful)
  const limit = Math.min(pagesToFetch.length, 80);
  console.log(`  [Physiopedia] Fetching ${limit} pages...`);

  for (let i = 0; i < limit; i++) {
    const page = pagesToFetch[i];
    try {
      const url = `${API_BASE}?action=parse&pageid=${page.pageid}&format=json&prop=text`;
      const res = await fetchJson<ParseResponse>(url, 10000);

      if (!res.parse?.text?.['*']) continue;

      const rawHtml = res.parse.text['*'];
      const content = stripHtml(rawHtml);

      if (content.length < 100) continue;

      chunks.push({
        id: makeId('physiopedia', String(page.pageid)),
        source: 'Physiopedia',
        title: page.title,
        content: truncate(content),
        categories: categorize(page.title, content),
        evidence_quality: 'high',
        url: `https://www.physio-pedia.com/${encodeURIComponent(page.title.replace(/ /g, '_'))}`,
        fetched_at: new Date().toISOString(),
        tags: ['physical therapy', 'rehabilitation', 'exercise science'],
      });

      if ((i + 1) % 20 === 0) console.log(`  [Physiopedia] ${i + 1}/${limit} pages processed`);
      await sleep(600); // Respect rate limits
    } catch (e) {
      errors.push(`Physiopedia page "${page.title}" failed: ${(e as Error).message}`);
    }
  }

  return { chunks, source: 'Physiopedia', fetched: chunks.length, errors };
}
