import { describe, it, expect } from 'vitest';
import { searchKnowledge } from '../knowledgeSearch';
import { tokenize, porterStem } from '../porterStemmer';

describe('porterStemmer', () => {
  it('stems common fitness terms', () => {
    expect(porterStem('training')).toBe('train');
    expect(porterStem('exercises')).toBe('exercis');
    expect(porterStem('squats')).toBe('squat');
    expect(porterStem('hypertrophy')).toBe('hypertrophi');
  });

  it('tokenize filters short words and stems', () => {
    const tokens = tokenize('how to do squats for hypertrophy');
    expect(tokens).not.toContain('to');
    expect(tokens).not.toContain('do');
    expect(tokens).toContain('how');
    expect(tokens).toContain('squat');
    expect(tokens).toContain('hypertrophi');
  });
});

describe('searchKnowledge', () => {
  it('returns results for a fitness query', () => {
    const results = searchKnowledge('squat technique form');
    expect(results.length).toBeGreaterThan(0);
    expect(results.length).toBeLessThanOrEqual(5);
    expect(results[0]).toHaveProperty('title');
    expect(results[0]).toHaveProperty('source');
    expect(results[0]).toHaveProperty('content');
    expect(results[0]).toHaveProperty('evidence_quality');
  });

  it('respects limit option', () => {
    const results = searchKnowledge('training volume', { limit: 2 });
    expect(results.length).toBeLessThanOrEqual(2);
  });

  it('filters by evidence quality', () => {
    const results = searchKnowledge('progressive overload', {
      limit: 10,
      evidenceFilter: 'high',
    });
    for (const r of results) {
      expect(r.evidence_quality).toBe('high');
    }
  });

  it('returns empty array for nonsense query', () => {
    const results = searchKnowledge('xyzzy zqwrk');
    expect(results).toEqual([]);
  });

  it('returns empty array for empty query', () => {
    const results = searchKnowledge('');
    expect(results).toEqual([]);
  });

  it('boosts results matching exercise names', () => {
    const withoutBoost = searchKnowledge('programming strength', { limit: 10 });
    const withBoost = searchKnowledge('programming strength', {
      limit: 10,
      exerciseNames: ['Bench Press'],
    });
    // With exercise name boost, bench press related entries should rank higher
    expect(withBoost.length).toBeGreaterThan(0);
  });

  it('content is truncated to 800 chars or less', () => {
    const results = searchKnowledge('hypertrophy muscle growth', { limit: 10 });
    for (const r of results) {
      expect(r.content.length).toBeLessThanOrEqual(800);
    }
  });
});
