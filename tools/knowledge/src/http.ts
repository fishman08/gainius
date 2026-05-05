const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36';

export async function fetchText(url: string, timeoutMs = 10000): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,application/json,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchJson<T = unknown>(url: string, timeoutMs = 10000): Promise<T> {
  const text = await fetchText(url, timeoutMs);
  return JSON.parse(text) as T;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export function makeId(source: string, identifier: string): string {
  return `${source}::${identifier}`.replace(/[^a-zA-Z0-9:_-]/g, '_').slice(0, 128);
}

export function truncate(text: string, maxChars = 6000): string {
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars - 3) + '...';
}

const ENTITY_MAP: Record<string, string> = {
  '&nbsp;': ' ',
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&apos;': "'",
  '&mdash;': '—',
  '&ndash;': '–',
  '&lsquo;': '\u2018',
  '&rsquo;': '\u2019',
  '&ldquo;': '\u201C',
  '&rdquo;': '\u201D',
  '&hellip;': '…',
  '&copy;': '©',
  '&reg;': '®',
  '&trade;': '™',
};

export function decodeEntities(text: string): string {
  let result = text;
  for (const [entity, char] of Object.entries(ENTITY_MAP)) {
    result = result.replaceAll(entity, char);
  }
  // Numeric entities: &#160; &#8217; etc.
  result = result.replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)));
  // Hex entities: &#x2019; etc.
  result = result.replace(/&#x([0-9a-fA-F]+);/g, (_, hex) =>
    String.fromCharCode(parseInt(hex, 16)),
  );
  return result;
}

export function stripHtml(html: string): string {
  return decodeEntities(
    html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
      .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim(),
  );
}

export function categorizeFromText(title: string, content: string, feedTags: string[]): string[] {
  const text = `${title} ${content} ${feedTags.join(' ')}`.toLowerCase();
  const cats: string[] = [];

  if (
    /strength|hypertrophy|muscle.build|weight.train|powerlifting|resistance.train|progressive.overload|periodization|barbell|dumbbell|squat|bench.press|deadlift/.test(
      text,
    )
  )
    cats.push('strength_hypertrophy');
  if (/cardio|endurance|aerobic|running|cycling|vo2|marathon|zone.2/.test(text))
    cats.push('cardio_endurance');
  if (/recovery|mobility|foam.roll|deload|overtraining|sleep/.test(text))
    cats.push('mobility_recovery');
  if (/hiit|high.intensity.interval|tabata|sprint|conditioning|circuit/.test(text))
    cats.push('hiit_conditioning');
  if (/flexibility|stretching|range.of.motion|yoga/.test(text)) cats.push('flexibility');
  if (/injury|prevention|rehab|rehabilitation|physical.therapy|pain/.test(text))
    cats.push('rehab_injury_prevention');
  if (/bodyweight|calisthen|push.?up|pull.?up|no.equipment/.test(text))
    cats.push('calisthenics_bodyweight');
  if (/nutrition|protein|supplement|creatine|diet|calori|macro/.test(text))
    cats.push('nutrition_performance');
  if (/sport.specific|athletic|agility|plyometric/.test(text)) cats.push('sport_specific');

  return cats.length > 0 ? cats : ['strength_hypertrophy'];
}
