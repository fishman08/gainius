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
