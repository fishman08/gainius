import { describe, it, expect } from 'vitest';
import { searchExercises, getExercisesByCategory, normalizeExerciseName } from '../exerciseSearch';

describe('searchExercises', () => {
  it('returns empty for empty query', () => {
    expect(searchExercises('')).toEqual([]);
    expect(searchExercises('   ')).toEqual([]);
  });

  it('finds exact match', () => {
    const results = searchExercises('Bench Press');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].name).toBe('Bench Press');
  });

  it('finds by prefix', () => {
    const results = searchExercises('Bench');
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((r) => r.name === 'Bench Press')).toBe(true);
  });

  it('finds by alias', () => {
    const results = searchExercises('Flat Bench');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].name).toBe('Bench Press');
  });

  it('finds by substring', () => {
    const results = searchExercises('curl');
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((r) => r.name.toLowerCase().includes('curl'))).toBe(true);
  });

  it('respects limit parameter', () => {
    const results = searchExercises('press', 3);
    expect(results.length).toBeLessThanOrEqual(3);
  });

  it('ranks exact > prefix > substring', () => {
    const results = searchExercises('Squat');
    expect(results[0].name).toBe('Squat');
  });

  it('returns no results for nonsense query', () => {
    expect(searchExercises('xyznonexistent')).toEqual([]);
  });
});

describe('getExercisesByCategory', () => {
  it('returns chest exercises', () => {
    const results = getExercisesByCategory('Chest');
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((r) => r.category === 'Chest')).toBe(true);
  });

  it('returns back exercises', () => {
    const results = getExercisesByCategory('Back');
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((r) => r.category === 'Back')).toBe(true);
  });
});

describe('normalizeExerciseName', () => {
  it('returns canonical name for exact match', () => {
    expect(normalizeExerciseName('Bench Press')).toBe('Bench Press');
  });

  it('normalizes alias to canonical name', () => {
    expect(normalizeExerciseName('Flat Bench')).toBe('Bench Press');
    expect(normalizeExerciseName('BB Row')).toBe('Barbell Row');
    expect(normalizeExerciseName('RDL')).toBe('Romanian Deadlift');
  });

  it('is case insensitive', () => {
    expect(normalizeExerciseName('bench press')).toBe('Bench Press');
    expect(normalizeExerciseName('FLAT BENCH')).toBe('Bench Press');
  });

  it('returns original for unknown exercises', () => {
    expect(normalizeExerciseName('My Custom Exercise')).toBe('My Custom Exercise');
  });

  it('trims whitespace', () => {
    expect(normalizeExerciseName('  Bench Press  ')).toBe('Bench Press');
  });
});
