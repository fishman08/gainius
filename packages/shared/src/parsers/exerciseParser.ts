import type { ExtractedExercise } from './types';

/**
 * Patterns matched (examples):
 *  - "Bench Press: 4 sets x 8 reps"
 *  - "Bench Press: 4 sets x 8 reps at 135 lbs"
 *  - "Squats - 3x10 at 185 lbs"
 *  - "Deadlift 5x5 @ 225"
 *  - "Pull-ups: 3 sets to failure"
 *  - "Overhead Press: 3 sets x 8-10 reps"
 */

// Pattern 1: "Exercise Name: X sets x Y reps [at Z lbs/kg]"
const PATTERN_SETS_X_REPS =
  /^(?:[•\-*]|\d+[.)])\s*(.+?):\s*(\d+)\s*sets?\s*[x×]\s*(\d+(?:\s*-\s*\d+)?)\s*reps?(?:\s*(?:at|@)\s*(\d+(?:\.\d+)?)\s*(?:lbs?|kg|pounds?)?)?/im;

// Pattern 2: "Exercise Name - XxY [at Z lbs/kg]"
const PATTERN_XxY =
  /^(?:[•\-*]|\d+[.)])\s*(.+?)\s*[-–:]\s*(\d+)\s*[x×]\s*(\d+(?:\s*-\s*\d+)?)(?:\s*(?:at|@)\s*(\d+(?:\.\d+)?)\s*(?:lbs?|kg|pounds?)?)?/im;

// Pattern 3: "Exercise Name XxY @ Z"
const PATTERN_INLINE =
  /^(?:[•\-*]|\d+[.)])\s*(.+?)\s+(\d+)\s*[x×]\s*(\d+(?:\s*-\s*\d+)?)\s*(?:(?:at|@)\s*(\d+(?:\.\d+)?))?/im;

// Pattern 4: "Exercise Name: X sets to failure"
const PATTERN_TO_FAILURE =
  /^(?:[•\-*]|\d+[.)])\s*(.+?):\s*(\d+)\s*sets?\s*(?:to\s+)?(?:failure|max(?:\s*reps?)?)/im;

// Pattern 5: "Exercise Name: X sets x max reps"
const PATTERN_MAX_REPS = /^(?:[•\-*]|\d+[.)])\s*(.+?):\s*(\d+)\s*sets?\s*[x×]\s*max\s*(?:reps?)?/im;

function cleanName(raw: string): string {
  return raw
    .replace(/[*_`]/g, '') // strip markdown
    .replace(/\s+/g, ' ')
    .trim();
}

function parseLine(line: string): ExtractedExercise | null {
  let match: RegExpMatchArray | null;

  // Try failure/max patterns first (more specific)
  match = line.match(PATTERN_TO_FAILURE);
  if (match) {
    return {
      name: cleanName(match[1]),
      sets: parseInt(match[2], 10),
      reps: 'failure',
      confidence: 0.9,
    };
  }

  match = line.match(PATTERN_MAX_REPS);
  if (match) {
    return {
      name: cleanName(match[1]),
      sets: parseInt(match[2], 10),
      reps: 'max',
      confidence: 0.9,
    };
  }

  // "X sets x Y reps" format (highest confidence)
  match = line.match(PATTERN_SETS_X_REPS);
  if (match) {
    return {
      name: cleanName(match[1]),
      sets: parseInt(match[2], 10),
      reps: match[3].includes('-') ? match[3].replace(/\s/g, '') : parseInt(match[3], 10),
      weight: match[4] ? parseFloat(match[4]) : undefined,
      confidence: 0.95,
    };
  }

  // "X x Y" with separator format
  match = line.match(PATTERN_XxY);
  if (match) {
    return {
      name: cleanName(match[1]),
      sets: parseInt(match[2], 10),
      reps: match[3].includes('-') ? match[3].replace(/\s/g, '') : parseInt(match[3], 10),
      weight: match[4] ? parseFloat(match[4]) : undefined,
      confidence: 0.85,
    };
  }

  // Inline "XxY" format
  match = line.match(PATTERN_INLINE);
  if (match) {
    const name = cleanName(match[1]);
    // Avoid false positives on short/numeric names
    if (name.length < 3) return null;
    return {
      name,
      sets: parseInt(match[2], 10),
      reps: match[3].includes('-') ? match[3].replace(/\s/g, '') : parseInt(match[3], 10),
      weight: match[4] ? parseFloat(match[4]) : undefined,
      confidence: 0.75,
    };
  }

  return null;
}

export function extractExercises(text: string): ExtractedExercise[] {
  const lines = text.split('\n');
  const results: ExtractedExercise[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const exercise = parseLine(trimmed);
    if (exercise) {
      results.push(exercise);
    }
  }

  return results;
}
