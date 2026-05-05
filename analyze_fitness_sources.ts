#!/usr/bin/env npx ts-node
/**
 * FITNESS SOURCE ANALYSIS SCRIPT
 * --------------------------------
 * Run with: npx ts-node analyze_fitness_sources.ts
 * Or:       npm install -g ts-node && ts-node analyze_fitness_sources.ts
 *
 * Outputs:
 *   - fitness_sources_verified.json   → Full annotated source list with live status
 *   - fitness_sources_ranked.json     → Sorted by ingestion priority score
 *   - fitness_sources_summary.md      → Human-readable report
 */

import * as https from 'https';
import * as http from 'http';
import * as fs from 'fs';
import * as url from 'url';

// ─── TYPES ──────────────────────────────────────────────────────────────────

interface SourceDefinition {
  name: string;
  base_url: string;
  scraping_targets: ScrapeTarget[];
  content_type: string;
  evidence_quality: 'high' | 'medium' | 'low';
  update_frequency: 'daily' | 'weekly' | 'monthly' | 'irregular';
  categories: WorkoutCategory[];
  access_model: 'free' | 'freemium' | 'paid' | 'api_key_required';
  scraping_method: 'rss' | 'api' | 'html' | 'json_file' | 'sitemap';
  js_rendering_required: boolean;
  notes: string;
}

interface ScrapeTarget {
  label: string;
  url: string;
  type: 'rss' | 'api' | 'html' | 'json' | 'sitemap' | 'robots';
  priority: number; // 1 = primary, 2 = secondary, 3 = supplementary
}

type WorkoutCategory =
  | 'strength_hypertrophy'
  | 'cardio_endurance'
  | 'mobility_recovery'
  | 'calisthenics_bodyweight'
  | 'hiit_conditioning'
  | 'flexibility'
  | 'sport_specific'
  | 'mind_body'
  | 'rehab_injury_prevention'
  | 'nutrition_performance';

interface VerifiedSource extends SourceDefinition {
  live_check: {
    timestamp: string;
    targets_tested: number;
    targets_accessible: number;
    primary_target_status: number | null;
    primary_target_accessible: boolean;
    robots_txt_found: boolean;
    robots_allows_bots: boolean | null;
    response_time_ms: number | null;
    content_type_detected: string | null;
  };
  ingestion_score: number; // 0–100, computed
  recommended_scrape_interval_hours: number;
  ingestion_notes: string[];
}

// ─── SOURCE DEFINITIONS ─────────────────────────────────────────────────────

const SOURCES: SourceDefinition[] = [
  {
    name: 'PubMed / PubMed Central (NCBI)',
    base_url: 'https://pubmed.ncbi.nlm.nih.gov',
    scraping_targets: [
      {
        label: 'ESearch – resistance training abstracts',
        url: 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=resistance+training[MeSH]+AND+muscle+hypertrophy&retmax=10&retmode=json',
        type: 'api',
        priority: 1,
      },
      {
        label: 'EFetch – fetch abstract by PMID',
        url: 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=33054160&rettype=abstract&retmode=xml',
        type: 'api',
        priority: 1,
      },
      {
        label: 'PMC OAI-PMH – open-access full text',
        url: 'https://www.ncbi.nlm.nih.gov/pmc/oai/oai.cgi?verb=Identify',
        type: 'api',
        priority: 2,
      },
      {
        label: 'Robots.txt',
        url: 'https://pubmed.ncbi.nlm.nih.gov/robots.txt',
        type: 'robots',
        priority: 3,
      },
    ],
    content_type: 'Peer-reviewed abstracts and open-access full-text via E-utilities REST API',
    evidence_quality: 'high',
    update_frequency: 'daily',
    categories: [
      'strength_hypertrophy',
      'cardio_endurance',
      'mobility_recovery',
      'hiit_conditioning',
      'rehab_injury_prevention',
    ],
    access_model: 'free',
    scraping_method: 'api',
    js_rendering_required: false,
    notes:
      'Best single source for research. Register free NCBI API key for 10 req/sec (3/sec without). Key MeSH terms: Exercise, Resistance Training, HIIT, Physical Fitness. Use ESearch → EFetch workflow. PMC OAI-PMH bulk access at 3 req/sec.',
  },
  {
    name: 'Frontiers in Sports and Active Living',
    base_url: 'https://www.frontiersin.org',
    scraping_targets: [
      {
        label: 'RSS feed',
        url: 'https://www.frontiersin.org/journals/sports-and-active-living/articles?format=rss',
        type: 'rss',
        priority: 1,
      },
      {
        label: 'Article listing',
        url: 'https://www.frontiersin.org/journals/sports-and-active-living/articles',
        type: 'html',
        priority: 2,
      },
      {
        label: 'Robots.txt',
        url: 'https://www.frontiersin.org/robots.txt',
        type: 'robots',
        priority: 3,
      },
    ],
    content_type: 'Open-access peer-reviewed research (CC-BY license)',
    evidence_quality: 'high',
    update_frequency: 'daily',
    categories: [
      'strength_hypertrophy',
      'cardio_endurance',
      'mobility_recovery',
      'hiit_conditioning',
    ],
    access_model: 'free',
    scraping_method: 'rss',
    js_rendering_required: true,
    notes:
      'React/Next.js frontend — prefer PMC API access for full text. RSS gives article metadata. CC-BY license means free reuse.',
  },
  {
    name: 'MDPI Sports',
    base_url: 'https://www.mdpi.com',
    scraping_targets: [
      {
        label: 'RSS feed',
        url: 'https://www.mdpi.com/rss/journal/sports',
        type: 'rss',
        priority: 1,
      },
      {
        label: 'Journal listing',
        url: 'https://www.mdpi.com/journal/sports',
        type: 'html',
        priority: 2,
      },
      {
        label: 'Robots.txt',
        url: 'https://www.mdpi.com/robots.txt',
        type: 'robots',
        priority: 3,
      },
    ],
    content_type: 'Open-access peer-reviewed exercise science articles (CC-BY)',
    evidence_quality: 'high',
    update_frequency: 'weekly',
    categories: ['strength_hypertrophy', 'cardio_endurance', 'mobility_recovery', 'sport_specific'],
    access_model: 'free',
    scraping_method: 'rss',
    js_rendering_required: false,
    notes: 'ISSN 2075-4663. Clean RSS. Also indexed in PMC for full text.',
  },
  {
    name: 'Springer Nature Open Access API',
    base_url: 'https://api.springernature.com',
    scraping_targets: [
      {
        label: 'Open Access sports API',
        url: 'https://api.springernature.com/openaccess/json?q=resistance+training&p=5&api_key=REPLACE_WITH_KEY',
        type: 'api',
        priority: 1,
      },
      {
        label: 'Sports Medicine Open RSS',
        url: 'https://sportsmedicine-open.springeropen.com/articles?format=rss',
        type: 'rss',
        priority: 2,
      },
    ],
    content_type: 'Open-access sports medicine and exercise research via Springer Nature API',
    evidence_quality: 'high',
    update_frequency: 'weekly',
    categories: [
      'strength_hypertrophy',
      'cardio_endurance',
      'mobility_recovery',
      'rehab_injury_prevention',
    ],
    access_model: 'api_key_required',
    scraping_method: 'api',
    js_rendering_required: false,
    notes:
      'Free API key at dev.springernature.com. 500 requests/day free tier. JSON and XML output. Replace REPLACE_WITH_KEY before running.',
  },
  {
    name: 'ACSM – Position Stands & Blog',
    base_url: 'https://www.acsm.org',
    scraping_targets: [
      {
        label: 'Position Stands page',
        url: 'https://www.acsm.org/education-resources/pronouncements-scientific-communications/position-stands/',
        type: 'html',
        priority: 1,
      },
      {
        label: 'Blog',
        url: 'https://www.acsm.org/all-blog-posts/',
        type: 'html',
        priority: 2,
      },
      {
        label: 'Robots.txt',
        url: 'https://www.acsm.org/robots.txt',
        type: 'robots',
        priority: 3,
      },
    ],
    content_type: 'Authoritative exercise prescription guidelines and Position Stands',
    evidence_quality: 'high',
    update_frequency: 'monthly',
    categories: [
      'strength_hypertrophy',
      'cardio_endurance',
      'mobility_recovery',
      'hiit_conditioning',
      'nutrition_performance',
    ],
    access_model: 'free',
    scraping_method: 'html',
    js_rendering_required: false,
    notes:
      'Gold-standard Position Stands are free. MSSE journal articles paywalled. Blog covers all major training modalities.',
  },
  {
    name: 'Stronger By Science',
    base_url: 'https://www.strongerbyscience.com',
    scraping_targets: [
      {
        label: 'Articles RSS feed',
        url: 'https://www.strongerbyscience.com/articles/feed',
        type: 'rss',
        priority: 1,
      },
      {
        label: 'Meta-analysis master list',
        url: 'https://www.strongerbyscience.com/master-list/',
        type: 'html',
        priority: 1,
      },
      {
        label: 'Sitemap',
        url: 'https://www.strongerbyscience.com/sitemap_index.xml',
        type: 'sitemap',
        priority: 2,
      },
      {
        label: 'Robots.txt',
        url: 'https://www.strongerbyscience.com/robots.txt',
        type: 'robots',
        priority: 3,
      },
    ],
    content_type:
      'In-depth evidence-based training articles and meta-analysis index by Greg Nuckols',
    evidence_quality: 'high',
    update_frequency: 'irregular',
    categories: ['strength_hypertrophy', 'cardio_endurance', 'hiit_conditioning'],
    access_model: 'free',
    scraping_method: 'rss',
    js_rendering_required: false,
    notes:
      'Master-list page is extremely high value — curated links to all major exercise meta-analyses. May 403 bots — use browser-like headers.',
  },
  {
    name: 'Renaissance Periodization',
    base_url: 'https://rpstrength.com',
    scraping_targets: [
      {
        label: 'Blog Atom feed',
        url: 'https://rpstrength.com/blogs/articles.atom',
        type: 'rss',
        priority: 1,
      },
      {
        label: 'Blog listing',
        url: 'https://rpstrength.com/blogs/articles',
        type: 'html',
        priority: 2,
      },
      {
        label: 'Sitemap',
        url: 'https://rpstrength.com/sitemap.xml',
        type: 'sitemap',
        priority: 3,
      },
    ],
    content_type: 'Hypertrophy and periodization articles by PhD-level exercise scientists',
    evidence_quality: 'high',
    update_frequency: 'weekly',
    categories: ['strength_hypertrophy', 'mobility_recovery', 'nutrition_performance'],
    access_model: 'free',
    scraping_method: 'rss',
    js_rendering_required: false,
    notes:
      'Shopify platform. Atom feed at /blogs/articles.atom. Pagination via ?page=N. High-quality hypertrophy content by Dr. Mike Israetel.',
  },
  {
    name: 'Breaking Muscle',
    base_url: 'https://breakingmuscle.com',
    scraping_targets: [
      {
        label: 'Main RSS feed',
        url: 'https://breakingmuscle.com/feed/rss',
        type: 'rss',
        priority: 1,
      },
      {
        label: 'Fitness RSS',
        url: 'https://breakingmuscle.com/feed/fitness.xml',
        type: 'rss',
        priority: 1,
      },
      {
        label: 'Workouts RSS',
        url: 'https://breakingmuscle.com/feed/workouts.xml',
        type: 'rss',
        priority: 1,
      },
      {
        label: 'Healthy eating RSS',
        url: 'https://breakingmuscle.com/feed/healthy-eating.xml',
        type: 'rss',
        priority: 2,
      },
      {
        label: 'Sitemap',
        url: 'https://breakingmuscle.com/sitemap.xml',
        type: 'sitemap',
        priority: 3,
      },
    ],
    content_type: 'Training articles, exercise guides, and workout programming',
    evidence_quality: 'medium',
    update_frequency: 'daily',
    categories: [
      'strength_hypertrophy',
      'cardio_endurance',
      'mobility_recovery',
      'calisthenics_bodyweight',
      'hiit_conditioning',
      'nutrition_performance',
    ],
    access_model: 'free',
    scraping_method: 'rss',
    js_rendering_required: false,
    notes:
      'Best RSS infrastructure of any practitioner site — 9 category-specific feeds. WordPress/Genesis. Server-rendered and scraper-friendly.',
  },
  {
    name: 'Examine.com',
    base_url: 'https://examine.com',
    scraping_targets: [
      {
        label: 'Supplement guides',
        url: 'https://examine.com/guides/',
        type: 'html',
        priority: 1,
      },
      {
        label: 'Conditions index',
        url: 'https://examine.com/conditions/',
        type: 'html',
        priority: 2,
      },
      {
        label: 'Sitemap',
        url: 'https://examine.com/sitemap.xml',
        type: 'sitemap',
        priority: 3,
      },
    ],
    content_type:
      'Evidence-graded supplement and exercise research summaries by independent researchers',
    evidence_quality: 'high',
    update_frequency: 'daily',
    categories: [
      'strength_hypertrophy',
      'cardio_endurance',
      'mobility_recovery',
      'nutrition_performance',
    ],
    access_model: 'freemium',
    scraping_method: 'html',
    js_rendering_required: true,
    notes:
      'Basic pages free, full summaries behind Examine+ (~$29/month). No public API. 800+ supplement entries with evidence grades. Custom CMS — may need headless browser.',
  },
  {
    name: 'Science for Sport',
    base_url: 'https://scienceforsport.com',
    scraping_targets: [
      {
        label: 'RSS feed',
        url: 'https://scienceforsport.com/feed',
        type: 'rss',
        priority: 1,
      },
      {
        label: 'Blog',
        url: 'https://scienceforsport.com/blog',
        type: 'html',
        priority: 2,
      },
      {
        label: 'Sitemap',
        url: 'https://scienceforsport.com/sitemap.xml',
        type: 'sitemap',
        priority: 3,
      },
    ],
    content_type: 'Research summaries for sports science practitioners',
    evidence_quality: 'high',
    update_frequency: 'weekly',
    categories: ['strength_hypertrophy', 'cardio_endurance', 'mobility_recovery', 'sport_specific'],
    access_model: 'freemium',
    scraping_method: 'rss',
    js_rendering_required: false,
    notes: 'WordPress. Free blog content; premium full summaries gated.',
  },
  {
    name: 'free-exercise-db (GitHub)',
    base_url: 'https://github.com/yuhonas/free-exercise-db',
    scraping_targets: [
      {
        label: 'Exercises JSON (public domain)',
        url: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json',
        type: 'json',
        priority: 1,
      },
      {
        label: 'README',
        url: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/README.md',
        type: 'html',
        priority: 3,
      },
    ],
    content_type: 'Public domain structured JSON exercise database — 800+ exercises',
    evidence_quality: 'medium',
    update_frequency: 'irregular',
    categories: [
      'strength_hypertrophy',
      'cardio_endurance',
      'mobility_recovery',
      'calisthenics_bodyweight',
      'flexibility',
    ],
    access_model: 'free',
    scraping_method: 'json_file',
    js_rendering_required: false,
    notes:
      'PUBLIC DOMAIN (Unlicense). Single JSON download — no API, no pagination, no auth. Fields: name, force, level, mechanic, equipment, primaryMuscles, secondaryMuscles, instructions, category, images. Best starting point for structured exercise data.',
  },
  {
    name: 'wger Workout Manager API',
    base_url: 'https://wger.de',
    scraping_targets: [
      {
        label: 'Exercise categories',
        url: 'https://wger.de/api/v2/exercisecategory/?format=json',
        type: 'api',
        priority: 1,
      },
      {
        label: 'Exercise list (English)',
        url: 'https://wger.de/api/v2/exercise/?format=json&language=2&limit=100',
        type: 'api',
        priority: 1,
      },
      {
        label: 'Exercise info (detailed)',
        url: 'https://wger.de/api/v2/exerciseinfo/1/',
        type: 'api',
        priority: 2,
      },
      {
        label: 'Muscles',
        url: 'https://wger.de/api/v2/muscle/?format=json',
        type: 'api',
        priority: 2,
      },
      {
        label: 'Equipment',
        url: 'https://wger.de/api/v2/equipment/?format=json',
        type: 'api',
        priority: 2,
      },
    ],
    content_type: 'Open-source REST API exercise database with muscles, equipment, translations',
    evidence_quality: 'medium',
    update_frequency: 'monthly',
    categories: ['strength_hypertrophy', 'cardio_endurance', 'mobility_recovery'],
    access_model: 'free',
    scraping_method: 'api',
    js_rendering_required: false,
    notes:
      'No auth required for public endpoints. Django REST Framework. Pagination via limit/offset. Self-hostable via Docker for unlimited access. License: AGPL-3.0 (code), CC-BY-SA 3.0 (exercise data).',
  },
  {
    name: 'ExRx.net Exercise Database',
    base_url: 'https://exrx.net',
    scraping_targets: [
      {
        label: 'Exercise directory',
        url: 'https://exrx.net/Lists/Directory',
        type: 'html',
        priority: 1,
      },
      {
        label: 'Muscle index',
        url: 'https://exrx.net/Lists/Muscle',
        type: 'html',
        priority: 2,
      },
      {
        label: 'Site notes/journal',
        url: 'https://exrx.net/Notes/SiteJournal',
        type: 'html',
        priority: 3,
      },
    ],
    content_type:
      'Gold-standard exercise classification with biomechanics, muscle maps, and joint analysis',
    evidence_quality: 'high',
    update_frequency: 'monthly',
    categories: [
      'strength_hypertrophy',
      'cardio_endurance',
      'mobility_recovery',
      'calisthenics_bodyweight',
      'rehab_injury_prevention',
    ],
    access_model: 'freemium',
    scraping_method: 'api',
    js_rendering_required: false,
    notes:
      'CONTENT IS COPYRIGHTED. Do not scrape without permission. Has a commercial JSON REST API — contact /Store/Other/Licensing for bearer token pricing. Static HTML (easy to parse if licensed). 2,100+ exercises with synergist/stabilizer breakdowns.',
  },
  {
    name: 'ExerciseDB API (Open Source)',
    base_url: 'https://exercisedb.dev',
    scraping_targets: [
      {
        label: 'Open source fork',
        url: 'https://github.com/bootstrapping-lab/exercisedb-api',
        type: 'html',
        priority: 1,
      },
      {
        label: 'Official API docs',
        url: 'https://exercisedb.dev/docs',
        type: 'html',
        priority: 2,
      },
    ],
    content_type:
      'REST API with 1,300+ exercises — target muscles, equipment, GIF demos, instructions',
    evidence_quality: 'medium',
    update_frequency: 'irregular',
    categories: [
      'strength_hypertrophy',
      'cardio_endurance',
      'mobility_recovery',
      'calisthenics_bodyweight',
    ],
    access_model: 'free',
    scraping_method: 'api',
    js_rendering_required: false,
    notes:
      'Self-host open-source v1 (1,300 exercises) via the bootstrapping-lab fork. Commercial v2 has 11,000+ but requires RapidAPI key. Fields: exerciseId, name, bodyParts, targetMuscles, secondaryMuscles, equipment, instructions, exerciseTips, gifUrl.',
  },
  {
    name: 'MuscleWiki API',
    base_url: 'https://api.musclewiki.com',
    scraping_targets: [
      {
        label: 'API root',
        url: 'https://api.musclewiki.com/',
        type: 'api',
        priority: 1,
      },
      {
        label: 'API demo',
        url: 'https://api.musclewiki.com/demo',
        type: 'html',
        priority: 2,
      },
    ],
    content_type: 'Commercial REST API — 1,800+ exercises with video demonstrations',
    evidence_quality: 'medium',
    update_frequency: 'monthly',
    categories: ['strength_hypertrophy', 'calisthenics_bodyweight', 'rehab_injury_prevention'],
    access_model: 'api_key_required',
    scraping_method: 'api',
    js_rendering_required: false,
    notes:
      'Requires X-API-Key header. Free: 500 calls/month (playground). Paid: $5/mo (1K), $29/mo (20K), $79/mo (100K). FastAPI backend. Filters: muscle group, equipment, experience level. 7,300+ video demos.',
  },
  {
    name: 'DAREBEE',
    base_url: 'https://darebee.com',
    scraping_targets: [
      {
        label: 'Workout library',
        url: 'https://darebee.com/workouts.html',
        type: 'html',
        priority: 1,
      },
      {
        label: 'Exercise library',
        url: 'https://darebee.com/exercises.html',
        type: 'html',
        priority: 1,
      },
      {
        label: 'Training programs',
        url: 'https://darebee.com/programs.html',
        type: 'html',
        priority: 2,
      },
      {
        label: 'Fitness guides',
        url: 'https://darebee.com/fitness.html',
        type: 'html',
        priority: 2,
      },
    ],
    content_type: 'Non-profit bodyweight workout library — 2,600+ illustrated workout posters',
    evidence_quality: 'medium',
    update_frequency: 'daily',
    categories: [
      'calisthenics_bodyweight',
      'cardio_endurance',
      'hiit_conditioning',
      'flexibility',
      'mind_body',
    ],
    access_model: 'free',
    scraping_method: 'html',
    js_rendering_required: false,
    notes:
      'NON-PROFIT. Static HTML — very easy to scrape. Workout data encoded in IMAGE posters — use OCR or vision model to extract exercise text. Metadata (name, type, difficulty) in page HTML. No API or RSS. New workouts Monday–Thursday.',
  },
  {
    name: 'ACE Exercise Library',
    base_url: 'https://www.acefitness.org',
    scraping_targets: [
      {
        label: 'Exercise library',
        url: 'https://www.acefitness.org/resources/everyone/exercise-library/',
        type: 'html',
        priority: 1,
      },
      {
        label: 'Blog',
        url: 'https://www.acefitness.org/resources/everyone/blog/',
        type: 'html',
        priority: 2,
      },
      {
        label: 'Robots.txt',
        url: 'https://www.acefitness.org/robots.txt',
        type: 'robots',
        priority: 3,
      },
    ],
    content_type: 'Authoritative exercise library with photos, step-by-step instructions',
    evidence_quality: 'high',
    update_frequency: 'weekly',
    categories: ['strength_hypertrophy', 'cardio_endurance', 'mobility_recovery', 'flexibility'],
    access_model: 'free',
    scraping_method: 'html',
    js_rendering_required: true,
    notes:
      '200–400 exercises with filtering (body part, equipment, level). Commercial content licensing available. Exercise URLs: /resources/everyone/exercise-library/{id}/{slug}. JS may be required for filtering interface.',
  },
  {
    name: 'HIIT Science',
    base_url: 'https://hiitscience.com',
    scraping_targets: [
      {
        label: 'RSS feed',
        url: 'https://hiitscience.com/feed/',
        type: 'rss',
        priority: 1,
      },
      {
        label: 'Blog',
        url: 'https://hiitscience.com/hiit-science-blog/',
        type: 'html',
        priority: 2,
      },
      {
        label: 'Sitemap',
        url: 'https://hiitscience.com/sitemap.xml',
        type: 'sitemap',
        priority: 3,
      },
    ],
    content_type:
      'HIIT research articles and applied training science by sports PhDs (Buchheit & Laursen)',
    evidence_quality: 'high',
    update_frequency: 'weekly',
    categories: ['hiit_conditioning', 'cardio_endurance', 'strength_hypertrophy'],
    access_model: 'freemium',
    scraping_method: 'rss',
    js_rendering_required: false,
    notes:
      'WordPress — server-rendered. RSS at /feed/. Founded by Martin Buchheit & Paul Laursen. Accredited by NSCA, BASES, ESSA, USA Triathlon. Free blog; paid courses.',
  },
  {
    name: 'Uphill Athlete',
    base_url: 'https://uphillathlete.com',
    scraping_targets: [
      {
        label: 'RSS feed',
        url: 'https://uphillathlete.com/feed/',
        type: 'rss',
        priority: 1,
      },
      {
        label: 'Aerobic training',
        url: 'https://uphillathlete.com/aerobic-training/',
        type: 'html',
        priority: 2,
      },
      {
        label: 'Strength training',
        url: 'https://uphillathlete.com/strength-training/',
        type: 'html',
        priority: 2,
      },
      {
        label: 'Sitemap',
        url: 'https://uphillathlete.com/sitemap.xml',
        type: 'sitemap',
        priority: 3,
      },
    ],
    content_type: 'Endurance training science — aerobic base, zone training, mountain athletics',
    evidence_quality: 'high',
    update_frequency: 'weekly',
    categories: ['cardio_endurance', 'strength_hypertrophy', 'mobility_recovery', 'sport_specific'],
    access_model: 'free',
    scraping_method: 'rss',
    js_rendering_required: false,
    notes:
      'WordPress — server-rendered, scraper-friendly. Written by Olympic-level coaches. Excellent coverage of polarized training, zone 2, aerobic threshold concepts.',
  },
  {
    name: 'TrainingPeaks Blog',
    base_url: 'https://www.trainingpeaks.com',
    scraping_targets: [
      {
        label: 'Blog listing',
        url: 'https://www.trainingpeaks.com/blog/',
        type: 'html',
        priority: 1,
      },
      {
        label: 'RSS feed',
        url: 'https://www.trainingpeaks.com/blog/feed/',
        type: 'rss',
        priority: 1,
      },
      {
        label: 'Robots.txt',
        url: 'https://www.trainingpeaks.com/robots.txt',
        type: 'robots',
        priority: 3,
      },
    ],
    content_type: 'Endurance coaching articles — cycling, running, triathlon, training zones',
    evidence_quality: 'high',
    update_frequency: 'daily',
    categories: ['cardio_endurance', 'sport_specific', 'nutrition_performance'],
    access_model: 'free',
    scraping_method: 'rss',
    js_rendering_required: false,
    notes:
      'Blog is free; platform is subscription. High-authority endurance coaching platform. Certified coaches and exercise physiologists. Rate limiting likely — use polite crawl delays.',
  },
  {
    name: 'Squat University',
    base_url: 'https://squatuniversity.com',
    scraping_targets: [
      {
        label: 'RSS feed',
        url: 'https://squatuniversity.com/feed/',
        type: 'rss',
        priority: 1,
      },
      {
        label: 'Full blog index',
        url: 'https://squatuniversity.com/featured-links/blog/',
        type: 'html',
        priority: 1,
      },
      {
        label: 'Sitemap',
        url: 'https://squatuniversity.com/sitemap_index.xml',
        type: 'sitemap',
        priority: 2,
      },
    ],
    content_type:
      'Mobility, movement assessment, and injury prevention by Dr. Aaron Horschig (DPT)',
    evidence_quality: 'high',
    update_frequency: 'weekly',
    categories: [
      'mobility_recovery',
      'strength_hypertrophy',
      'rehab_injury_prevention',
      'flexibility',
    ],
    access_model: 'free',
    scraping_method: 'rss',
    js_rendering_required: false,
    notes:
      'WordPress — easiest to scrape of all sites. ALL content free. Blog index organized by: Mobility Help (ankle/hip/overhead/thoracic), Stability Help (knee/core), Technique Fixes (squat/deadlift/Olympic), Injury & Rehab.',
  },
  {
    name: 'Physiopedia',
    base_url: 'https://www.physio-pedia.com',
    scraping_targets: [
      {
        label: 'Therapeutic exercise category API',
        url: 'https://www.physio-pedia.com/api.php?action=query&list=categorymembers&cmtitle=Category:Therapeutic_Exercise&format=json&cmlimit=50',
        type: 'api',
        priority: 1,
      },
      {
        label: 'Parse page by name',
        url: 'https://www.physio-pedia.com/api.php?action=parse&page=Therapeutic_Exercise&format=json',
        type: 'api',
        priority: 1,
      },
      {
        label: 'Stretching page',
        url: 'https://www.physio-pedia.com/api.php?action=parse&page=Stretching&format=json',
        type: 'api',
        priority: 2,
      },
    ],
    content_type: 'Physical therapy encyclopedia with referenced rehab and exercise protocols',
    evidence_quality: 'high',
    update_frequency: 'daily',
    categories: [
      'mobility_recovery',
      'rehab_injury_prevention',
      'flexibility',
      'strength_hypertrophy',
    ],
    access_model: 'free',
    scraping_method: 'api',
    js_rendering_required: false,
    notes:
      'MediaWiki API at /api.php. action=query for category listings; action=parse for full page content. FREE open access. May have Cloudflare protection — use browser-like headers and respect rate limits.',
  },
  {
    name: 'NASM Blog',
    base_url: 'https://blog.nasm.org',
    scraping_targets: [
      {
        label: 'Main blog',
        url: 'https://blog.nasm.org/',
        type: 'html',
        priority: 1,
      },
      {
        label: 'Corrective exercise',
        url: 'https://blog.nasm.org/ces/',
        type: 'html',
        priority: 1,
      },
      {
        label: 'Fitness articles',
        url: 'https://blog.nasm.org/fitness/',
        type: 'html',
        priority: 1,
      },
      {
        label: 'Sitemap',
        url: 'https://blog.nasm.org/sitemap.xml',
        type: 'sitemap',
        priority: 2,
      },
    ],
    content_type: 'Corrective exercise, flexibility protocols, and evidence-based training',
    evidence_quality: 'high',
    update_frequency: 'weekly',
    categories: [
      'mobility_recovery',
      'strength_hypertrophy',
      'flexibility',
      'rehab_injury_prevention',
      'cardio_endurance',
    ],
    access_model: 'free',
    scraping_method: 'html',
    js_rendering_required: false,
    notes:
      'ALL blog content free. Strong corrective exercise coverage (overactive/underactive muscles, movement screening). Server-rendered HTML.',
  },
  {
    name: 'BJSM Blog & Podcast',
    base_url: 'https://bjsm.bmj.com',
    scraping_targets: [
      {
        label: 'RSS table of contents',
        url: 'https://bjsm.bmj.com/rss/current.xml',
        type: 'rss',
        priority: 1,
      },
      {
        label: 'Blog',
        url: 'https://bjsm.bmj.com/pages/blog/',
        type: 'html',
        priority: 2,
      },
      {
        label: 'Robots.txt',
        url: 'https://bjsm.bmj.com/robots.txt',
        type: 'robots',
        priority: 3,
      },
    ],
    content_type:
      "Clinical sports medicine blog, podcast notes, Editor's Choice open-access articles",
    evidence_quality: 'high',
    update_frequency: 'weekly',
    categories: [
      'strength_hypertrophy',
      'cardio_endurance',
      'rehab_injury_prevention',
      'sport_specific',
    ],
    access_model: 'freemium',
    scraping_method: 'rss',
    js_rendering_required: false,
    notes:
      "Impact Factor 16.2. Articles mostly paywalled — use PubMed for abstracts. Blog, podcast, and Editor's Choice articles are FREE. HighWire Press platform — clean semantic HTML. RSS for TOC.",
  },
  {
    name: 'T-Nation',
    base_url: 'https://www.t-nation.com',
    scraping_targets: [
      {
        label: 'Training articles',
        url: 'https://www.t-nation.com/training/',
        type: 'html',
        priority: 1,
      },
      {
        label: 'Bodybuilding articles',
        url: 'https://www.t-nation.com/bodybuilding/',
        type: 'html',
        priority: 1,
      },
      {
        label: 'Sitemap',
        url: 'https://www.t-nation.com/sitemap.xml',
        type: 'sitemap',
        priority: 2,
      },
    ],
    content_type: 'Practitioner training articles — 20+ years of archived content',
    evidence_quality: 'medium',
    update_frequency: 'daily',
    categories: ['strength_hypertrophy', 'calisthenics_bodyweight', 'mobility_recovery'],
    access_model: 'free',
    scraping_method: 'html',
    js_rendering_required: true,
    notes:
      'Custom CMS. Thousands of articles from experienced coaches (Thibaudeau, Cressey, Dan John). Contains supplement marketing — filter when ingesting. Custom platform may have aggressive bot detection.',
  },
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function fetch(
  targetUrl: string,
  timeoutMs = 10000,
): Promise<{ status: number; contentType: string; body: string }> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(targetUrl);
    const lib = parsed.protocol === 'https:' ? https : http;
    const options = {
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method: 'GET',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        Connection: 'keep-alive',
      },
      timeout: timeoutMs,
    };

    const req = lib.request(options, (res) => {
      const chunks: Buffer[] = [];
      res.on('data', (c: Buffer) => chunks.push(c));
      res.on('end', () => {
        resolve({
          status: res.statusCode ?? 0,
          contentType: res.headers['content-type'] ?? '',
          body: Buffer.concat(chunks).toString('utf-8', 0, 3000),
        });
      });
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('TIMEOUT'));
    });
    req.on('error', reject);
    req.end();
  });
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function computeScore(source: SourceDefinition, liveCheck: VerifiedSource['live_check']): number {
  let score = 0;

  // Evidence quality (0–30)
  score += source.evidence_quality === 'high' ? 30 : source.evidence_quality === 'medium' ? 15 : 5;

  // Accessibility (0–20)
  score += liveCheck.primary_target_accessible ? 20 : 0;

  // Access model (0–15)
  score += source.access_model === 'free' ? 15 : source.access_model === 'freemium' ? 8 : 3;

  // Update frequency (0–10)
  score += source.update_frequency === 'daily' ? 10 : source.update_frequency === 'weekly' ? 7 : 3;

  // No JS rendering required (0–10)
  score += !source.js_rendering_required ? 10 : 0;

  // Robots allows bots (0–5)
  if (liveCheck.robots_allows_bots === true) score += 5;
  else if (liveCheck.robots_allows_bots === null) score += 2;

  // Category breadth (0–10)
  score += Math.min(source.categories.length * 2, 10);

  return Math.min(score, 100);
}

// ─── MAIN ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🏋️  FITNESS SOURCE ANALYSIS');
  console.log('='.repeat(70));
  console.log(`Testing ${SOURCES.length} sources | ${new Date().toISOString()}\n`);

  const verified: VerifiedSource[] = [];

  for (const source of SOURCES) {
    const primaryTarget = source.scraping_targets.find((t) => t.priority === 1)!;
    const robotsTarget = source.scraping_targets.find((t) => t.type === 'robots');

    let primaryStatus: number | null = null;
    let primaryAccessible = false;
    let responseTime: number | null = null;
    let contentTypeDetected: string | null = null;
    let robotsFound = false;
    let robotsAllows: boolean | null = null;
    let targetsAccessible = 0;

    // Test primary target
    const start = Date.now();
    try {
      const res = await fetch(primaryTarget.url, 8000);
      responseTime = Date.now() - start;
      primaryStatus = res.status;
      primaryAccessible = res.status >= 200 && res.status < 400;
      contentTypeDetected = res.contentType.split(';')[0].trim();
      if (primaryAccessible) targetsAccessible++;
    } catch (e: any) {
      primaryStatus = 0;
      primaryAccessible = false;
      responseTime = Date.now() - start;
    }

    // Test robots.txt
    if (robotsTarget) {
      try {
        const res = await fetch(robotsTarget.url, 5000);
        if (res.status === 200) {
          robotsFound = true;
          const body = res.body.toLowerCase();
          if (body.includes('disallow: /') && !body.includes('disallow: \n')) {
            robotsAllows = false;
          } else {
            robotsAllows = true;
          }
        }
      } catch {
        // robots.txt fetch/parse failed — leave robotsAllows as previously set
      }
    }

    // Status symbol
    const sym = primaryAccessible ? '✅' : '❌';
    console.log(`${sym} ${source.name}`);
    console.log(`   Primary: ${primaryTarget.url.substring(0, 70)}`);
    console.log(
      `   Status: ${primaryStatus} | ${responseTime}ms | ${contentTypeDetected ?? 'unknown'}`,
    );
    if (robotsFound)
      console.log(`   Robots: found | bots ${robotsAllows ? 'ALLOWED' : 'may be restricted'}`);
    console.log();

    const liveCheck: VerifiedSource['live_check'] = {
      timestamp: new Date().toISOString(),
      targets_tested: 1,
      targets_accessible: targetsAccessible,
      primary_target_status: primaryStatus,
      primary_target_accessible: primaryAccessible,
      robots_txt_found: robotsFound,
      robots_allows_bots: robotsAllows,
      response_time_ms: responseTime,
      content_type_detected: contentTypeDetected,
    };

    const score = computeScore(source, liveCheck);

    // Ingestion recommendations
    const notes: string[] = [];
    if (!primaryAccessible)
      notes.push('⚠️ Primary target unreachable — verify URL or check for bot blocking');
    if (source.js_rendering_required)
      notes.push('🔧 Requires headless browser (Playwright/Puppeteer) for JS-rendered content');
    if (source.access_model === 'api_key_required')
      notes.push('🔑 Register for API key before ingesting');
    if (source.access_model === 'freemium')
      notes.push('💰 Partial paywall — only ingest freely accessible content');
    if (source.name.includes('ExRx'))
      notes.push('⚖️ Commercial licensing required — do NOT scrape without permission');
    if (responseTime && responseTime > 3000)
      notes.push('🐢 Slow response time — increase scrape intervals');

    const intervalMap: Record<string, number> = {
      daily: 24,
      weekly: 168,
      monthly: 720,
      irregular: 336,
    };

    verified.push({
      ...source,
      live_check: liveCheck,
      ingestion_score: score,
      recommended_scrape_interval_hours: intervalMap[source.update_frequency] ?? 168,
      ingestion_notes: notes,
    });

    await sleep(400);
  }

  // Sort by score
  const ranked = [...verified].sort((a, b) => b.ingestion_score - a.ingestion_score);

  // Write outputs
  fs.writeFileSync('fitness_sources_verified.json', JSON.stringify(verified, null, 2));
  fs.writeFileSync('fitness_sources_ranked.json', JSON.stringify(ranked, null, 2));

  // Summary report
  const accessible = verified.filter((v) => v.live_check.primary_target_accessible);
  const report = `# Fitness Sources Analysis Report
Generated: ${new Date().toISOString()}

## Summary
- **Total sources tested:** ${verified.length}
- **Accessible:** ${accessible.length}/${verified.length}
- **Free access:** ${verified.filter((v) => v.access_model === 'free').length}
- **Freemium:** ${verified.filter((v) => v.access_model === 'freemium').length}
- **API key required:** ${verified.filter((v) => v.access_model === 'api_key_required').length}
- **No JS rendering needed:** ${verified.filter((v) => !v.js_rendering_required).length}

## Top 10 by Ingestion Score
${ranked
  .slice(0, 10)
  .map(
    (s, i) =>
      `${i + 1}. **${s.name}** — Score: ${s.ingestion_score}/100 | ${s.live_check.primary_target_accessible ? '✅ Live' : '❌ Unreachable'} | ${s.access_model} | ${s.evidence_quality} evidence`,
  )
  .join('\n')}

## Recommended Ingestion Stack
### Tier 1 — Start Here (Free APIs + JSON)
- PubMed E-utilities (research literature)
- free-exercise-db (structured exercise data, public domain)
- wger API (exercise database with REST API)
- Physiopedia MediaWiki API (rehab & mobility protocols)

### Tier 2 — RSS Ingestion (Daily/Weekly)
- Breaking Muscle (9 category-specific RSS feeds)
- Stronger By Science (articles + meta-analysis master list)
- Renaissance Periodization (periodization & hypertrophy)
- Squat University (mobility & injury prevention)
- HIIT Science (interval training science)
- Uphill Athlete (endurance & zone training)

### Tier 3 — HTML Scraping (Structured Content)
- ACSM Position Stands (exercise prescription guidelines)
- NASM Blog (corrective exercise)
- Examine.com (supplement/training interaction data)
- DAREBEE (bodyweight workouts — requires OCR for image content)

## Sources Requiring Special Setup
${verified
  .filter((v) => v.ingestion_notes.length > 0)
  .map((v) => `- **${v.name}:** ${v.ingestion_notes.join(' | ')}`)
  .join('\n')}
`;

  fs.writeFileSync('fitness_sources_summary.md', report);

  console.log('\n' + '='.repeat(70));
  console.log(`✅ ${accessible.length}/${verified.length} sources accessible`);
  console.log('\n📦 Output files:');
  console.log('   fitness_sources_verified.json  → Full source list with live check results');
  console.log('   fitness_sources_ranked.json    → Sorted by ingestion priority score');
  console.log('   fitness_sources_summary.md     → Human-readable report\n');
  console.log('🏆 Top 5 by ingestion score:');
  ranked.slice(0, 5).forEach((s, i) => {
    console.log(`   ${i + 1}. ${s.name} — ${s.ingestion_score}/100`);
  });
}

main().catch(console.error);
