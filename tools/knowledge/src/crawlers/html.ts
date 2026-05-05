/**
 * HTML scraper for static sites
 * Handles: NASM Blog, DAREBEE exercise library
 * Extracts article links from index pages, then fetches content
 */

import { fetchText, sleep, makeId, truncate } from '../http.js';
import type { KnowledgeChunk, CrawlerResult } from '../types.js';

function stripHtml(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractLinks(
  html: string,
  baseUrl: string,
  pattern: RegExp,
): { href: string; text: string }[] {
  const links: { href: string; text: string }[] = [];
  const linkRegex = /<a\s[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match;

  while ((match = linkRegex.exec(html)) !== null) {
    const href = match[1];
    const text = stripHtml(match[2]).trim();
    if (!text || text.length < 5) continue;

    const fullUrl = href.startsWith('http') ? href : new URL(href, baseUrl).href;
    if (pattern.test(fullUrl)) {
      links.push({ href: fullUrl, text });
    }
  }

  return links;
}

function extractArticleContent(html: string): string {
  // Try to extract main content area
  const articleMatch =
    html.match(/<article[^>]*>([\s\S]*?)<\/article>/i) ??
    html.match(/<main[^>]*>([\s\S]*?)<\/main>/i) ??
    html.match(
      /<div[^>]*class="[^"]*(?:entry-content|post-content|article-body|blog-content)[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    );

  const content = articleMatch ? articleMatch[1] : html;
  return stripHtml(content);
}

async function crawlNasm(): Promise<{ chunks: KnowledgeChunk[]; errors: string[] }> {
  const chunks: KnowledgeChunk[] = [];
  const errors: string[] = [];
  const seenUrls = new Set<string>();

  const indexPages = ['https://blog.nasm.org/ces/', 'https://blog.nasm.org/fitness/'];

  for (const indexUrl of indexPages) {
    try {
      const html = await fetchText(indexUrl, 12000);
      const links = extractLinks(html, 'https://blog.nasm.org', /blog\.nasm\.org\/[a-z0-9-]+\/?$/);

      // Limit to 20 articles per category
      const toFetch = links.filter((l) => !seenUrls.has(l.href)).slice(0, 20);

      console.log(
        `  [NASM] ${indexUrl.split('/').filter(Boolean).pop()} → ${toFetch.length} articles`,
      );

      for (const link of toFetch) {
        seenUrls.add(link.href);
        try {
          const articleHtml = await fetchText(link.href, 10000);
          const content = extractArticleContent(articleHtml);

          if (content.length < 200) continue;

          // Extract title from <title> or <h1>
          const titleMatch =
            articleHtml.match(/<title>([^<]+)<\/title>/i) ??
            articleHtml.match(/<h1[^>]*>([^<]+)<\/h1>/i);
          const title = titleMatch ? stripHtml(titleMatch[1]) : link.text;

          const text = `${title} ${content}`.toLowerCase();
          const categories: string[] = [];
          if (/corrective|overactive|underactive|movement/.test(text))
            categories.push('rehab_injury_prevention');
          if (/stretch|flexibility|mobility/.test(text)) categories.push('flexibility');
          if (/strength|resistance|hypertrophy/.test(text)) categories.push('strength_hypertrophy');
          if (/cardio|aerobic|endurance/.test(text)) categories.push('cardio_endurance');
          if (categories.length === 0) categories.push('strength_hypertrophy');

          chunks.push({
            id: makeId('nasm', link.href),
            source: 'NASM Blog',
            title: truncate(title, 300),
            content: truncate(content),
            categories,
            evidence_quality: 'high',
            url: link.href,
            fetched_at: new Date().toISOString(),
            tags: ['corrective exercise', 'NASM', 'certified trainer'],
          });

          await sleep(500);
        } catch (e) {
          errors.push(`NASM article ${link.href} failed: ${(e as Error).message}`);
        }
      }
    } catch (e) {
      errors.push(`NASM index ${indexUrl} failed: ${(e as Error).message}`);
    }

    await sleep(500);
  }

  return { chunks, errors };
}

async function crawlDarebee(): Promise<{ chunks: KnowledgeChunk[]; errors: string[] }> {
  const chunks: KnowledgeChunk[] = [];
  const errors: string[] = [];

  try {
    const html = await fetchText('https://darebee.com/exercises.html', 12000);

    // DAREBEE exercise pages follow /exercises/{name}.html pattern
    const links = extractLinks(
      html,
      'https://darebee.com',
      /darebee\.com\/exercises\/[a-z0-9-]+\.html/,
    );
    const toFetch = links.slice(0, 50);

    console.log(`  [DAREBEE] Found ${links.length} exercises, fetching ${toFetch.length}`);

    for (const link of toFetch) {
      try {
        const pageHtml = await fetchText(link.href, 10000);
        const content = extractArticleContent(pageHtml);

        if (content.length < 50) continue;

        const titleMatch = pageHtml.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
        const title = titleMatch ? stripHtml(titleMatch[1]) : link.text;

        chunks.push({
          id: makeId('darebee', link.href),
          source: 'DAREBEE',
          title: truncate(title, 300),
          content: truncate(content),
          categories: ['calisthenics_bodyweight', 'hiit_conditioning'],
          evidence_quality: 'medium',
          url: link.href,
          fetched_at: new Date().toISOString(),
          tags: ['bodyweight', 'no equipment', 'exercise guide'],
        });

        await sleep(400);
      } catch (e) {
        errors.push(`DAREBEE ${link.href} failed: ${(e as Error).message}`);
      }
    }
  } catch (e) {
    errors.push(`DAREBEE index failed: ${(e as Error).message}`);
  }

  return { chunks, errors };
}

export async function crawlHtmlSources(): Promise<CrawlerResult> {
  const allChunks: KnowledgeChunk[] = [];
  const allErrors: string[] = [];

  console.log('  [HTML] Crawling NASM Blog...');
  const nasm = await crawlNasm();
  allChunks.push(...nasm.chunks);
  allErrors.push(...nasm.errors);

  console.log('  [HTML] Crawling DAREBEE...');
  const darebee = await crawlDarebee();
  allChunks.push(...darebee.chunks);
  allErrors.push(...darebee.errors);

  return {
    chunks: allChunks,
    source: 'HTML scrapers',
    fetched: allChunks.length,
    errors: allErrors,
  };
}
