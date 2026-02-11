import { describe, it, expect } from 'vitest';
import { parseVoiceInput } from '../voiceParser';

describe('parseVoiceInput', () => {
  describe('name + sets x reps @ weight pattern', () => {
    it('parses "bench press 3 by 10 at 135"', () => {
      const result = parseVoiceInput('bench press 3 by 10 at 135');
      expect(result).toMatchObject({
        name: 'bench press',
        sets: 3,
        reps: 10,
        weight: 135,
      });
      expect(result.confidence).toBeGreaterThanOrEqual(0.85);
    });
  });

  describe('sets of reps at weight pattern', () => {
    it('parses "3 sets of 10 reps at 135 pounds"', () => {
      const result = parseVoiceInput('3 sets of 10 reps at 135 pounds');
      expect(result).toMatchObject({
        sets: 3,
        reps: 10,
        weight: 135,
      });
      expect(result.confidence).toBeGreaterThanOrEqual(0.8);
    });
  });

  describe('"just did" pattern', () => {
    it('parses "just did 5 reps at 225"', () => {
      const result = parseVoiceInput('just did 5 reps at 225');
      expect(result).toMatchObject({
        sets: 1,
        reps: 5,
        weight: 225,
      });
      expect(result.confidence).toBeGreaterThanOrEqual(0.8);
    });
  });

  describe('reps at weight pattern', () => {
    it('parses "10 at 135"', () => {
      const result = parseVoiceInput('10 at 135');
      expect(result).toMatchObject({
        reps: 10,
        weight: 135,
      });
      expect(result.confidence).toBe(0.8);
    });
  });

  describe('weight for reps pattern', () => {
    it('parses "225 pounds for 5"', () => {
      const result = parseVoiceInput('225 pounds for 5');
      expect(result).toMatchObject({
        weight: 225,
        reps: 5,
      });
      expect(result.confidence).toBe(0.8);
    });
  });

  describe('reps only pattern', () => {
    it('parses "8 reps"', () => {
      const result = parseVoiceInput('8 reps');
      expect(result).toMatchObject({ reps: 8 });
      expect(result.confidence).toBe(0.7);
    });
  });

  describe('edge cases', () => {
    it('returns confidence 0 for no numbers', () => {
      const result = parseVoiceInput('hello world');
      expect(result.confidence).toBe(0);
    });

    it('normalizes uppercase input', () => {
      const result = parseVoiceInput('BENCH PRESS 3 BY 10 AT 135');
      expect(result.name).toBe('bench press');
      expect(result.sets).toBe(3);
    });

    it('normalizes trailing punctuation', () => {
      const result = parseVoiceInput('8 reps.');
      expect(result.reps).toBe(8);
    });

    it('preserves raw transcript', () => {
      const result = parseVoiceInput('  8 reps  ');
      expect(result.raw).toBe('8 reps');
    });
  });
});
