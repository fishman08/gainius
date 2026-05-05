# Fitness Sources Analysis Report

Generated: 2026-03-25T04:40:22.506Z

## Summary

- **Total sources tested:** 25
- **Accessible:** 22/25
- **Free access:** 18
- **Freemium:** 5
- **API key required:** 2
- **No JS rendering needed:** 21

## Top 10 by Ingestion Score

1. **PubMed / PubMed Central (NCBI)** — Score: 95/100 | ✅ Live | free | high evidence
2. **Physiopedia** — Score: 95/100 | ✅ Live | free | high evidence
3. **NASM Blog** — Score: 94/100 | ✅ Live | free | high evidence
4. **Uphill Athlete** — Score: 92/100 | ✅ Live | free | high evidence
5. **Squat University** — Score: 92/100 | ✅ Live | free | high evidence
6. **TrainingPeaks Blog** — Score: 91/100 | ✅ Live | free | high evidence
7. **ACSM – Position Stands & Blog** — Score: 90/100 | ✅ Live | free | high evidence
8. **Renaissance Periodization** — Score: 90/100 | ✅ Live | free | high evidence
9. **Science for Sport** — Score: 85/100 | ✅ Live | freemium | high evidence
10. **Stronger By Science** — Score: 84/100 | ✅ Live | free | high evidence

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

- **Frontiers in Sports and Active Living:** 🔧 Requires headless browser (Playwright/Puppeteer) for JS-rendered content
- **MDPI Sports:** ⚠️ Primary target unreachable — verify URL or check for bot blocking
- **Springer Nature Open Access API:** ⚠️ Primary target unreachable — verify URL or check for bot blocking | 🔑 Register for API key before ingesting
- **Examine.com:** 🔧 Requires headless browser (Playwright/Puppeteer) for JS-rendered content | 💰 Partial paywall — only ingest freely accessible content
- **Science for Sport:** 💰 Partial paywall — only ingest freely accessible content
- **ExRx.net Exercise Database:** 💰 Partial paywall — only ingest freely accessible content | ⚖️ Commercial licensing required — do NOT scrape without permission
- **MuscleWiki API:** 🔑 Register for API key before ingesting
- **ACE Exercise Library:** 🔧 Requires headless browser (Playwright/Puppeteer) for JS-rendered content
- **HIIT Science:** 💰 Partial paywall — only ingest freely accessible content
- **BJSM Blog & Podcast:** ⚠️ Primary target unreachable — verify URL or check for bot blocking | 💰 Partial paywall — only ingest freely accessible content
- **T-Nation:** 🔧 Requires headless browser (Playwright/Puppeteer) for JS-rendered content
