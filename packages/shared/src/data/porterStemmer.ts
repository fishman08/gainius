/**
 * Minimal Porter Stemmer (public domain algorithm)
 * Reduces English words to their stem for search indexing.
 */

const step2list: Record<string, string> = {
  ational: 'ate',
  tional: 'tion',
  enci: 'ence',
  anci: 'ance',
  izer: 'ize',
  bli: 'ble',
  alli: 'al',
  entli: 'ent',
  eli: 'e',
  ousli: 'ous',
  ization: 'ize',
  ation: 'ate',
  ator: 'ate',
  alism: 'al',
  iveness: 'ive',
  fulness: 'ful',
  ousness: 'ous',
  aliti: 'al',
  iviti: 'ive',
  biliti: 'ble',
  logi: 'log',
};

const step3list: Record<string, string> = {
  icate: 'ic',
  ative: '',
  alize: 'al',
  iciti: 'ic',
  ical: 'ic',
  ful: '',
  ness: '',
};

const c = '[^aeiou]';
const v = '[aeiouy]';
const C = c + '[^aeiouy]*';
const V = v + '[aeiou]*';
const mgr0 = new RegExp('^(' + C + ')?' + V + C);
const meq1 = new RegExp('^(' + C + ')?' + V + C + '(' + V + ')?$');
const mgr1 = new RegExp('^(' + C + ')?' + V + C + V + C);
const s_v = new RegExp('^(' + C + ')?' + v);

export function porterStem(w: string): string {
  if (w.length < 3) return w;

  let stem: string;
  let suffix: string;
  let re: RegExp;
  let re2: RegExp;
  let re3: RegExp;
  let re4: RegExp;

  if (w.charAt(0) === 'y') w = w.charAt(0).toUpperCase() + w.slice(1);

  // Step 1a
  re = /^(.+?)(ss|i)es$/;
  re2 = /^(.+?)([^s])s$/;
  if (re.test(w)) w = w.replace(re, '$1$2');
  else if (re2.test(w)) w = w.replace(re2, '$1$2');

  // Step 1b
  re = /^(.+?)eed$/;
  re2 = /^(.+?)(ed|ing)$/;
  if (re.test(w)) {
    const fp = re.exec(w)!;
    if (mgr0.test(fp[1])) w = w.slice(0, -1);
  } else if (re2.test(w)) {
    const fp = re2.exec(w)!;
    stem = fp[1];
    if (s_v.test(stem)) {
      w = stem;
      re2 = /(at|bl|iz)$/;
      re3 = /([^aeiouylsz])\1$/;
      re4 = new RegExp('^' + C + v + '[^aeiouwxy]$');
      if (re2.test(w)) w = w + 'e';
      else if (re3.test(w)) w = w.slice(0, -1);
      else if (re4.test(w)) w = w + 'e';
    }
  }

  // Step 1c
  re = /^(.+?)y$/;
  if (re.test(w)) {
    const fp = re.exec(w)!;
    stem = fp[1];
    if (s_v.test(stem)) w = stem + 'i';
  }

  // Step 2
  re =
    /^(.+?)(ational|tional|enci|anci|izer|bli|alli|entli|eli|ousli|ization|ation|ator|alism|iveness|fulness|ousness|aliti|iviti|biliti|logi)$/;
  if (re.test(w)) {
    const fp = re.exec(w)!;
    stem = fp[1];
    suffix = fp[2];
    if (mgr0.test(stem)) w = stem + step2list[suffix];
  }

  // Step 3
  re = /^(.+?)(icate|ative|alize|iciti|ical|ful|ness)$/;
  if (re.test(w)) {
    const fp = re.exec(w)!;
    stem = fp[1];
    suffix = fp[2];
    if (mgr0.test(stem)) w = stem + step3list[suffix];
  }

  // Step 4
  re = /^(.+?)(al|ance|ence|er|ic|able|ible|ant|ement|ment|ent|ou|ism|ate|iti|ous|ive|ize)$/;
  re2 = /^(.+?)(s|t)(ion)$/;
  if (re.test(w)) {
    const fp = re.exec(w)!;
    stem = fp[1];
    if (mgr1.test(stem)) w = stem;
  } else if (re2.test(w)) {
    const fp = re2.exec(w)!;
    stem = fp[1] + fp[2];
    if (mgr1.test(stem)) w = stem;
  }

  // Step 5
  re = /^(.+?)e$/;
  if (re.test(w)) {
    const fp = re.exec(w)!;
    stem = fp[1];
    re2 = new RegExp('^' + C + v + '[^aeiouwxy]$');
    if (mgr1.test(stem) || (meq1.test(stem) && !re2.test(stem))) w = stem;
  }
  re = /ll$/;
  if (re.test(w) && mgr1.test(w)) w = w.slice(0, -1);

  if (w.charAt(0) === 'Y') w = w.charAt(0).toLowerCase() + w.slice(1);

  return w;
}

/** Tokenize text into stemmed terms (min 3 chars, lowercased) */
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length >= 3)
    .map(porterStem);
}
