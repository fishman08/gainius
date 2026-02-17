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

  describe('day-of-week parsing', () => {
    it('assigns dayOfWeek from **DayName** headers', () => {
      const text = [
        '**Monday**',
        '- Bench Press: 4 sets x 8 reps at 135 lbs',
        '- Incline DB Press: 3 sets x 10 reps at 50 lbs',
        '',
        '**Wednesday**',
        '- Squat: 4 sets x 6 reps at 225 lbs',
      ].join('\n');

      const result = extractExercises(text);
      expect(result).toHaveLength(3);
      expect(result[0]).toMatchObject({ name: 'Bench Press', dayOfWeek: 1 });
      expect(result[1]).toMatchObject({ name: 'Incline DB Press', dayOfWeek: 1 });
      expect(result[2]).toMatchObject({ name: 'Squat', dayOfWeek: 3 });
    });

    it('handles day headers with labels like **Monday — Push**', () => {
      const text = [
        '**Monday — Push**',
        '- Bench Press: 4 sets x 8 reps at 135 lbs',
        '**Friday — Legs**',
        '- Squat: 4 sets x 6 reps at 225 lbs',
      ].join('\n');

      const result = extractExercises(text);
      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({ name: 'Bench Press', dayOfWeek: 1 });
      expect(result[1]).toMatchObject({ name: 'Squat', dayOfWeek: 5 });
    });

    it('leaves dayOfWeek undefined when no day header precedes exercises', () => {
      const result = extractExercises('- Bench Press: 4 sets x 8 reps at 135 lbs');
      expect(result).toHaveLength(1);
      expect(result[0].dayOfWeek).toBeUndefined();
    });

    it('handles all 7 days of the week', () => {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const lines = days.map((d, i) => `**${d}**\n- Exercise${i}: 3 sets x 10 reps`).join('\n');

      const result = extractExercises(lines);
      expect(result).toHaveLength(7);
      result.forEach((ex, i) => {
        expect(ex.dayOfWeek).toBe(i);
      });
    });

    it('is case-insensitive for day names', () => {
      const text = ['**MONDAY**', '- Bench Press: 4 sets x 8 reps'].join('\n');

      const result = extractExercises(text);
      expect(result[0].dayOfWeek).toBe(1);
    });
  });

  describe('section type parsing (warmup/cooldown/superset)', () => {
    it('marks exercises under ## Warm-up as warmup', () => {
      const text = [
        '## Warm-up',
        '- Jumping Jacks: 3 sets x 20 reps',
        '- Arm Circles: 2 sets x 15 reps',
        '',
        '## Working Sets',
        '- Bench Press: 4 sets x 8 reps at 135 lbs',
      ].join('\n');

      const result = extractExercises(text);
      expect(result).toHaveLength(3);
      expect(result[0]).toMatchObject({ name: 'Jumping Jacks', exerciseType: 'warmup' });
      expect(result[1]).toMatchObject({ name: 'Arm Circles', exerciseType: 'warmup' });
      expect(result[2]).toMatchObject({ name: 'Bench Press', exerciseType: 'working' });
    });

    it('marks exercises under **Cool-down** as cooldown', () => {
      const text = [
        '- Squat: 4 sets x 6 reps at 225 lbs',
        '**Cool-down**',
        '- Stretching: 3 sets x 30 reps',
      ].join('\n');

      const result = extractExercises(text);
      expect(result).toHaveLength(2);
      expect(result[0].exerciseType).toBeUndefined();
      expect(result[1]).toMatchObject({ name: 'Stretching', exerciseType: 'cooldown' });
    });

    it('handles warmup/cooldown header variants', () => {
      const text = [
        '### Warmup',
        '- Jumping Jacks: 2 sets x 20 reps',
        '### Cooldown',
        '- Stretching: 2 sets x 30 reps',
      ].join('\n');

      const result = extractExercises(text);
      expect(result[0]).toMatchObject({ exerciseType: 'warmup' });
      expect(result[1]).toMatchObject({ exerciseType: 'cooldown' });
    });

    it('detects superset notation (A1. / B1.)', () => {
      const text = [
        'A1. Bench Press: 3 sets x 8 reps at 135 lbs',
        'A2. Bent Over Row: 3 sets x 8 reps at 135 lbs',
        'B1. Overhead Press: 3 sets x 10 reps at 95 lbs',
        'B2. Lat Pulldown: 3 sets x 10 reps at 120 lbs',
      ].join('\n');

      const result = extractExercises(text);
      expect(result).toHaveLength(4);
      expect(result[0]).toMatchObject({
        name: 'Bench Press',
        exerciseType: 'superset',
        supersetGroup: 'A',
      });
      expect(result[1]).toMatchObject({
        name: 'Bent Over Row',
        exerciseType: 'superset',
        supersetGroup: 'A',
      });
      expect(result[2]).toMatchObject({
        name: 'Overhead Press',
        exerciseType: 'superset',
        supersetGroup: 'B',
      });
      expect(result[3]).toMatchObject({
        name: 'Lat Pulldown',
        exerciseType: 'superset',
        supersetGroup: 'B',
      });
    });

    it('combines day headers with section types', () => {
      const text = [
        '**Monday**',
        '## Warm-up',
        '- Jumping Jacks: 2 sets x 20 reps',
        '## Main Workout',
        '- Bench Press: 4 sets x 8 reps at 135 lbs',
      ].join('\n');

      const result = extractExercises(text);
      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({ dayOfWeek: 1, exerciseType: 'warmup' });
      expect(result[1]).toMatchObject({ dayOfWeek: 1, exerciseType: 'working' });
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
