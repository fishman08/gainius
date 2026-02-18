import { describe, it, expect } from 'vitest';
import { extractExercises } from '../exerciseParser';

describe('extractExercises', () => {
  describe('Pattern 1: "X sets x Y reps"', () => {
    it('parses "4 sets x 8 reps"', () => {
      const result = extractExercises('- Bench Press: 4 sets x 8 reps');
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        name: 'Bench Press',
        sets: 4,
        reps: 8,
        confidence: 0.95,
      });
    });

    it('parses with weight "at 135 lbs"', () => {
      const result = extractExercises('- Bench Press: 4 sets x 8 reps at 135 lbs');
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        name: 'Bench Press',
        sets: 4,
        reps: 8,
        weight: 135,
        confidence: 0.95,
      });
    });

    it('parses with "lbs" unit', () => {
      const result = extractExercises('- Squat: 3 sets x 10 reps at 225 lbs');
      expect(result[0].weight).toBe(225);
    });
  });

  describe('Pattern 2: "XxY" with separator', () => {
    it('parses "3x10 at 185 lbs"', () => {
      const result = extractExercises('- Squats - 3x10 at 185 lbs');
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        name: 'Squats',
        sets: 3,
        reps: 10,
        weight: 185,
        confidence: 0.85,
      });
    });
  });

  describe('Pattern 3: inline "XxY @ Z"', () => {
    it('parses "5x5 @ 225"', () => {
      const result = extractExercises('- Deadlift 5x5 @ 225');
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        name: 'Deadlift',
        sets: 5,
        reps: 5,
        weight: 225,
      });
    });
  });

  describe('Pattern 4: "to failure"', () => {
    it('parses "3 sets to failure"', () => {
      const result = extractExercises('- Pull-ups: 3 sets to failure');
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        name: 'Pull-ups',
        sets: 3,
        reps: 'failure',
        confidence: 0.9,
      });
    });
  });

  describe('Pattern 5: "max reps"', () => {
    it('parses "3 sets x max reps"', () => {
      const result = extractExercises('- Dips: 3 sets x max reps');
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        name: 'Dips',
        sets: 3,
        reps: 'max',
        confidence: 0.9,
      });
    });
  });

  describe('range reps', () => {
    it('parses "8-10 reps" as a range string', () => {
      const result = extractExercises('- Overhead Press: 3 sets x 8-10 reps');
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        name: 'Overhead Press',
        sets: 3,
        reps: '8-10',
        confidence: 0.95,
      });
    });
  });

  describe('multi-line extraction', () => {
    it('extracts multiple exercises from multi-line text', () => {
      const text = [
        '- Bench Press: 4 sets x 8 reps at 135 lbs',
        '- Squats - 3x10 at 185 lbs',
        '- Pull-ups: 3 sets to failure',
      ].join('\n');

      const result = extractExercises(text);
      expect(result).toHaveLength(3);
      expect(result[0].name).toBe('Bench Press');
      expect(result[1].name).toBe('Squats');
      expect(result[2].name).toBe('Pull-ups');
    });
  });

  describe('parser guards', () => {
    it('skips letter-prefixed section headers', () => {
      const result = extractExercises('A. Bench Press');
      expect(result).toHaveLength(0);
    });

    it('skips weight-first lines', () => {
      const result = extractExercises('- 210 lbs: 4 sets x 3 reps');
      expect(result).toHaveLength(0);
    });

    it('skips rest-period lines', () => {
      const result = extractExercises('- Rest: 60 seconds');
      expect(result).toHaveLength(0);
    });

    it('still parses valid exercises after skipping guards', () => {
      const text = [
        'A. Upper Body',
        '- 210 lbs: 4 sets x 3 reps',
        '- Rest: 90 seconds',
        '- Bench Press: 4 sets x 8 reps at 135 lbs',
      ].join('\n');
      const result = extractExercises(text);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Bench Press');
    });

    it('parses superset prefix A1. but skips plain A.', () => {
      const text = ['A. Upper Body', 'A1. Bench Press: 3 sets x 8 reps'].join('\n');
      const result = extractExercises(text);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Bench Press');
      expect(result[0].supersetGroup).toBe('A');
    });
  });

  describe('day-of-week parsing', () => {
    it('assigns dayOfWeek from **Monday** header', () => {
      const text = ['**Monday**', '- Bench Press: 4 sets x 8 reps'].join('\n');
      const result = extractExercises(text);
      expect(result).toHaveLength(1);
      expect(result[0].dayOfWeek).toBe(1);
    });

    it('assigns dayOfWeek from **Wednesday** header', () => {
      const text = ['**Wednesday**', '- Squats: 3 sets x 10 reps'].join('\n');
      const result = extractExercises(text);
      expect(result[0].dayOfWeek).toBe(3);
    });

    it('handles day headers with labels like **Monday — Push**', () => {
      const text = ['**Monday — Push**', '- Overhead Press: 3 sets x 8 reps'].join('\n');
      const result = extractExercises(text);
      expect(result[0].dayOfWeek).toBe(1);
    });

    it('leaves dayOfWeek undefined when no header', () => {
      const result = extractExercises('- Bench Press: 4 sets x 8 reps');
      expect(result[0].dayOfWeek).toBeUndefined();
    });

    it('is case-insensitive', () => {
      const text = ['**FRIDAY**', '- Deadlift: 5 sets x 5 reps'].join('\n');
      const result = extractExercises(text);
      expect(result[0].dayOfWeek).toBe(5);
    });
  });

  describe('section type parsing', () => {
    it('assigns warmup from ## Warm-up header', () => {
      const text = ['## Warm-up', '- Jumping Jacks: 3 sets x 20 reps'].join('\n');
      const result = extractExercises(text);
      expect(result[0].exerciseType).toBe('warmup');
    });

    it('assigns cooldown from **Cool-down** header', () => {
      const text = ['**Cool-down**', '- Stretching: 2 sets x 10 reps'].join('\n');
      const result = extractExercises(text);
      expect(result[0].exerciseType).toBe('cooldown');
    });

    it('handles warmup header variants (### Warmup)', () => {
      const text = ['### Warmup', '- Arm Circles: 2 sets x 15 reps'].join('\n');
      const result = extractExercises(text);
      expect(result[0].exerciseType).toBe('warmup');
    });

    it('parses superset notation A1/A2, B1/B2', () => {
      const text = [
        'A1. Bench Press: 3 sets x 8 reps',
        'A2. Bent Over Row: 3 sets x 8 reps',
        'B1. Overhead Press: 3 sets x 10 reps',
        'B2. Lat Pulldown: 3 sets x 10 reps',
      ].join('\n');
      const result = extractExercises(text);
      expect(result).toHaveLength(4);
      expect(result[0]).toMatchObject({ exerciseType: 'superset', supersetGroup: 'A' });
      expect(result[1]).toMatchObject({ exerciseType: 'superset', supersetGroup: 'A' });
      expect(result[2]).toMatchObject({ exerciseType: 'superset', supersetGroup: 'B' });
      expect(result[3]).toMatchObject({ exerciseType: 'superset', supersetGroup: 'B' });
    });

    it('combines day + section headers', () => {
      const text = [
        '**Monday**',
        '## Warm-up',
        '- Jumping Jacks: 3 sets x 20 reps',
        '## Main',
        '- Bench Press: 4 sets x 8 reps',
      ].join('\n');
      const result = extractExercises(text);
      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({ dayOfWeek: 1, exerciseType: 'warmup' });
      expect(result[1]).toMatchObject({ dayOfWeek: 1, exerciseType: 'working' });
    });

    it('resets section on new day header', () => {
      const text = [
        '**Monday**',
        '## Warm-up',
        '- Jumping Jacks: 3 sets x 20 reps',
        '**Tuesday**',
        '- Squats: 3 sets x 10 reps',
      ].join('\n');
      const result = extractExercises(text);
      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({ dayOfWeek: 1, exerciseType: 'warmup' });
      expect(result[1].dayOfWeek).toBe(2);
      expect(result[1].exerciseType).toBeUndefined();
    });

    it('leaves exerciseType undefined without section header', () => {
      const result = extractExercises('- Bench Press: 4 sets x 8 reps');
      expect(result[0].exerciseType).toBeUndefined();
    });
  });

  describe('edge cases', () => {
    it('returns empty array for empty input', () => {
      expect(extractExercises('')).toEqual([]);
    });

    it('returns empty array for text with no exercises', () => {
      expect(extractExercises('Hello world')).toEqual([]);
    });

    it('strips markdown formatting from names', () => {
      const result = extractExercises('- **Bench Press**: 4 sets x 8 reps');
      expect(result[0].name).toBe('Bench Press');
    });
  });
});
