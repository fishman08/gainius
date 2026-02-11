import { describe, it, expect } from 'vitest';
import {
  filterByPeriod,
  computeStats,
  getUniqueExercises,
  computeExerciseAnalytics,
  detectPersonalRecords,
  getRecentPRs,
  computeWeeklyVolume,
} from '../analytics';
import type { WorkoutSession } from '../../types';

function makeSession(overrides: Partial<WorkoutSession> & { date: string }): WorkoutSession {
  return {
    id: overrides.id ?? `session-${overrides.date}`,
    userId: 'local-user',
    date: overrides.date,
    startTime: `${overrides.date}T10:00:00Z`,
    completed: true,
    loggedExercises: overrides.loggedExercises ?? [],
  };
}

function makeExercise(name: string, sets: { weight: number; reps: number; completed?: boolean }[]) {
  return {
    id: `ex-${name}-${Math.random()}`,
    sessionId: '',
    exerciseName: name,
    sets: sets.map((s, i) => ({
      setNumber: i + 1,
      reps: s.reps,
      weight: s.weight,
      completed: s.completed ?? true,
      timestamp: '',
    })),
  };
}

const sessions: WorkoutSession[] = [
  makeSession({
    date: '2026-02-01',
    loggedExercises: [
      makeExercise('Bench Press', [
        { weight: 135, reps: 10 },
        { weight: 135, reps: 8 },
      ]),
      makeExercise('Squat', [{ weight: 225, reps: 5 }]),
    ],
  }),
  makeSession({
    date: '2026-02-05',
    loggedExercises: [
      makeExercise('Bench Press', [
        { weight: 145, reps: 8 },
        { weight: 145, reps: 7 },
      ]),
      makeExercise('Deadlift', [{ weight: 315, reps: 3 }]),
    ],
  }),
];

describe('filterByPeriod', () => {
  it('returns all sessions for "all"', () => {
    expect(filterByPeriod(sessions, 'all')).toHaveLength(2);
  });

  it('filters by week (recent sessions only)', () => {
    const recent = [makeSession({ date: new Date().toISOString().split('T')[0] })];
    const old = [makeSession({ date: '2020-01-01' })];
    const result = filterByPeriod([...old, ...recent], 'week');
    expect(result).toHaveLength(1);
  });

  it('filters by month', () => {
    const recent = [makeSession({ date: new Date().toISOString().split('T')[0] })];
    const old = [makeSession({ date: '2020-01-01' })];
    const result = filterByPeriod([...old, ...recent], 'month');
    expect(result).toHaveLength(1);
  });
});

describe('computeStats', () => {
  it('computes total volume and sets', () => {
    const stats = computeStats(sessions);
    // Session 1: 135*10 + 135*8 + 225*5 = 1350+1080+1125 = 3555
    // Session 2: 145*8 + 145*7 + 315*3 = 1160+1015+945 = 3120
    expect(stats.totalVolume).toBe(3555 + 3120);
    expect(stats.totalSets).toBe(6);
    expect(stats.totalWorkouts).toBe(2);
  });

  it('returns zeros for empty array', () => {
    const stats = computeStats([]);
    expect(stats.totalVolume).toBe(0);
    expect(stats.totalSets).toBe(0);
    expect(stats.totalWorkouts).toBe(0);
    expect(stats.avgWorkoutsPerWeek).toBe(0);
  });

  it('computes avgWorkoutsPerWeek', () => {
    const stats = computeStats(sessions);
    expect(stats.avgWorkoutsPerWeek).toBeGreaterThan(0);
  });
});

describe('getUniqueExercises', () => {
  it('returns sorted unique exercise names', () => {
    const names = getUniqueExercises(sessions);
    expect(names).toEqual(['Bench Press', 'Deadlift', 'Squat']);
  });

  it('returns empty for no sessions', () => {
    expect(getUniqueExercises([])).toEqual([]);
  });
});

describe('computeExerciseAnalytics', () => {
  it('computes data points for an exercise', () => {
    const analytics = computeExerciseAnalytics(sessions, 'Bench Press');
    expect(analytics.exerciseName).toBe('Bench Press');
    expect(analytics.dataPoints.length).toBe(4);
    expect(analytics.sessionCount).toBe(2);
  });

  it('computes bestWeight', () => {
    const analytics = computeExerciseAnalytics(sessions, 'Bench Press');
    expect(analytics.bestWeight).toBe(145);
  });

  it('computes avgWeight', () => {
    const analytics = computeExerciseAnalytics(sessions, 'Bench Press');
    // (135 + 135 + 145 + 145) / 4 = 140
    expect(analytics.avgWeight).toBe(140);
  });

  it('returns zeros for unknown exercise', () => {
    const analytics = computeExerciseAnalytics(sessions, 'Unknown');
    expect(analytics.dataPoints).toHaveLength(0);
    expect(analytics.bestWeight).toBe(0);
  });
});

describe('detectPersonalRecords', () => {
  it('detects PRs across sessions', () => {
    const prs = detectPersonalRecords(sessions);
    expect(prs.length).toBeGreaterThan(0);
    const benchPRs = prs.filter((p) => p.exerciseName === 'Bench Press');
    expect(benchPRs.length).toBe(2); // 135 then 145
    expect(benchPRs[0].previousBest).toBeNull();
    expect(benchPRs[1].previousBest).toBe(135);
  });
});

describe('getRecentPRs', () => {
  it('returns most recent PRs first', () => {
    const prs = getRecentPRs(sessions, 2);
    expect(prs.length).toBeLessThanOrEqual(2);
    // Most recent dates should come first
    if (prs.length >= 2) {
      expect(prs[0].date >= prs[1].date).toBe(true);
    }
  });
});

describe('computeWeeklyVolume', () => {
  it('groups volume by week', () => {
    const weekly = computeWeeklyVolume(sessions);
    expect(weekly.length).toBeGreaterThan(0);
    for (const w of weekly) {
      expect(w.volume).toBeGreaterThan(0);
      expect(w.sessionCount).toBeGreaterThan(0);
    }
  });

  it('returns empty for no sessions', () => {
    expect(computeWeeklyVolume([])).toEqual([]);
  });
});
