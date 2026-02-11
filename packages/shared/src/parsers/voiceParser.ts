export interface ParsedVoiceInput {
  name?: string;
  sets?: number;
  reps?: number;
  weight?: number;
  confidence: number;
  raw: string;
}

// "3 sets of 10 reps at 135 pounds" or "3 sets of 10 at 135"
const PATTERN_SETS_OF_REPS =
  /(\d+)\s*sets?\s*(?:of\s+)?(\d+)\s*(?:reps?\s*)?(?:(?:at|@|with)\s+(\d+(?:\.\d+)?)\s*(?:lbs?|pounds?|kg|kilos?)?)?/i;

// "bench press 3 by 10 at 135" / "bench press 3x10 at 135"
const PATTERN_NAME_XxY =
  /^(.+?)\s+(\d+)\s*(?:by|x|×)\s*(\d+)(?:\s*(?:at|@|with)\s+(\d+(?:\.\d+)?)\s*(?:lbs?|pounds?|kg|kilos?)?)?$/i;

// "just did 5 reps at 225"
const PATTERN_DID_REPS =
  /(?:just\s+)?did\s+(\d+)\s*reps?\s*(?:(?:at|@|with)\s+(\d+(?:\.\d+)?)\s*(?:lbs?|pounds?|kg|kilos?)?)?/i;

// "did 8 reps" (simpler version without weight)
const PATTERN_REPS_ONLY = /^(\d+)\s*reps?$/i;

// "10 at 135" / "10 reps at 135 lbs"
const PATTERN_REPS_AT_WEIGHT =
  /^(\d+)\s*(?:reps?\s*)?(?:at|@|with)\s+(\d+(?:\.\d+)?)\s*(?:lbs?|pounds?|kg|kilos?)?$/i;

// "225 pounds for 5" / "225 for 5 reps"
const PATTERN_WEIGHT_FOR_REPS =
  /(\d+(?:\.\d+)?)\s*(?:lbs?|pounds?|kg|kilos?)?\s+for\s+(\d+)\s*(?:reps?)?/i;

function normalizeTranscript(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[.,!?;:]+$/g, '')
    .replace(/\s+/g, ' ');
}

export function parseVoiceInput(transcript: string): ParsedVoiceInput {
  const raw = transcript.trim();
  const text = normalizeTranscript(raw);
  let match: RegExpMatchArray | null;

  // Pattern: "bench press 3 by 10 at 135"
  match = text.match(PATTERN_NAME_XxY);
  if (match) {
    return {
      name: match[1].trim(),
      sets: parseInt(match[2], 10),
      reps: parseInt(match[3], 10),
      weight: match[4] ? parseFloat(match[4]) : undefined,
      confidence: match[4] ? 0.95 : 0.85,
      raw,
    };
  }

  // Pattern: "3 sets of 10 reps at 135 pounds"
  match = text.match(PATTERN_SETS_OF_REPS);
  if (match) {
    return {
      sets: parseInt(match[1], 10),
      reps: parseInt(match[2], 10),
      weight: match[3] ? parseFloat(match[3]) : undefined,
      confidence: match[3] ? 0.9 : 0.8,
      raw,
    };
  }

  // Pattern: "just did 5 reps at 225"
  match = text.match(PATTERN_DID_REPS);
  if (match) {
    return {
      sets: 1,
      reps: parseInt(match[1], 10),
      weight: match[2] ? parseFloat(match[2]) : undefined,
      confidence: match[2] ? 0.85 : 0.7,
      raw,
    };
  }

  // Pattern: "10 at 135"
  match = text.match(PATTERN_REPS_AT_WEIGHT);
  if (match) {
    return {
      reps: parseInt(match[1], 10),
      weight: parseFloat(match[2]),
      confidence: 0.8,
      raw,
    };
  }

  // Pattern: "225 pounds for 5"
  match = text.match(PATTERN_WEIGHT_FOR_REPS);
  if (match) {
    return {
      weight: parseFloat(match[1]),
      reps: parseInt(match[2], 10),
      confidence: 0.8,
      raw,
    };
  }

  // Pattern: "8 reps"
  match = text.match(PATTERN_REPS_ONLY);
  if (match) {
    return {
      reps: parseInt(match[1], 10),
      confidence: 0.7,
      raw,
    };
  }

  // Fallback: extract all numbers from the transcript
  const numbers = text.match(/\d+(?:\.\d+)?/g)?.map(Number);
  if (numbers && numbers.length > 0) {
    if (numbers.length === 1) {
      return { reps: numbers[0], confidence: 0.5, raw };
    }
    if (numbers.length === 2) {
      const [a, b] = numbers;
      const reps = Math.min(a, b);
      const weight = Math.max(a, b);
      return { reps, weight, confidence: 0.5, raw };
    }
    // 3+ numbers: sets, reps, weight
    return { sets: numbers[0], reps: numbers[1], weight: numbers[2], confidence: 0.5, raw };
  }

  return { confidence: 0, raw };
}
