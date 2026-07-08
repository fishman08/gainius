import { describe, it, expect, vi } from 'vitest';
import { resolveGZCLP, seedT2Weight } from '../gzclpProgression';
import { resolveProgressionForPlan } from '../progressionStrategy';
import { suggestWeightsForPlan } from '../weightSuggestion';
import type { WorkoutPlan, WorkoutSession } from '../../types';

vi.mock('../weightSuggestion', () => ({
  suggestWeightsForPlan: vi.fn(() => []),
  suggestWeight: vi.fn(() => null),
}));

// --- resolveGZCLP unit tests ---

describe('resolveGZCLP — T1', () => {
  it('success: reps >= min → weight increases by inc', () => {
    const result = resolveGZCLP(
      { tier: 'T1', stage: 0, exerciseName: 'Bench Press', suggestedWeight: 135 },
      { reps: 3, hitAllReps: false },
    );
    expect(result.newStage).toBe(0);
    expect(result.suggestedWeight).toBe(140); // 135 + 5, rounded to 5
    expect(result.schemeLabel).toBe('5x3+');
    expect(result.transitionReason).toBeUndefined();
  });

  it('success: lower-body lift uses 10 lb increment', () => {
    const result = resolveGZCLP(
      { tier: 'T1', stage: 0, exerciseName: 'Squat', suggestedWeight: 200 },
      { reps: 4, hitAllReps: false },
    );
    expect(result.suggestedWeight).toBe(210);
  });

  it('miss at stage 0 → advance to stage 1, same weight', () => {
    const result = resolveGZCLP(
      { tier: 'T1', stage: 0, exerciseName: 'Bench Press', suggestedWeight: 135 },
      { reps: 2, hitAllReps: false },
    );
    expect(result.newStage).toBe(1);
    expect(result.suggestedWeight).toBe(135);
    expect(result.schemeLabel).toBe('6x2+');
    expect(result.transitionReason).toMatch(/6x2\+/);
  });

  it('miss at stage 1 → advance to stage 2, same weight', () => {
    const result = resolveGZCLP(
      { tier: 'T1', stage: 1, exerciseName: 'Bench Press', suggestedWeight: 135 },
      { reps: 1, hitAllReps: false },
    );
    expect(result.newStage).toBe(2);
    expect(result.suggestedWeight).toBe(135);
    expect(result.schemeLabel).toBe('10x1+');
  });

  it('miss at stage 2 → reset to stage 0 at -10% weight', () => {
    const result = resolveGZCLP(
      { tier: 'T1', stage: 2, exerciseName: 'Bench Press', suggestedWeight: 200 },
      { reps: 0, hitAllReps: false },
    );
    expect(result.newStage).toBe(0);
    expect(result.suggestedWeight).toBe(180); // 200 * 0.9 = 180, rounds to 180
    expect(result.schemeLabel).toBe('5x3+');
    expect(result.transitionReason).toMatch(/reset/);
  });
});

describe('resolveGZCLP — T2', () => {
  it('success: hitAllReps → weight increases', () => {
    const result = resolveGZCLP(
      { tier: 'T2', stage: 0, exerciseName: 'Bench Press', suggestedWeight: 100 },
      { reps: 10, hitAllReps: true },
    );
    expect(result.newStage).toBe(0);
    expect(result.suggestedWeight).toBe(105);
    expect(result.schemeLabel).toBe('3x10');
  });

  it('miss at stage 0 → advance to stage 1', () => {
    const result = resolveGZCLP(
      { tier: 'T2', stage: 0, exerciseName: 'Bench Press', suggestedWeight: 100 },
      { reps: 8, hitAllReps: false },
    );
    expect(result.newStage).toBe(1);
    expect(result.suggestedWeight).toBe(100);
    expect(result.schemeLabel).toBe('3x8');
  });

  it('miss at stage 2 → reset to stage 0, same weight', () => {
    const result = resolveGZCLP(
      { tier: 'T2', stage: 2, exerciseName: 'Bench Press', suggestedWeight: 100 },
      { reps: 5, hitAllReps: false },
    );
    expect(result.newStage).toBe(0);
    expect(result.suggestedWeight).toBe(100);
    expect(result.schemeLabel).toBe('3x10');
    expect(result.transitionReason).toMatch(/reset/);
  });
});

describe('resolveGZCLP — T3', () => {
  it('last set reps = 25 → weight increases by 5', () => {
    const result = resolveGZCLP(
      { tier: 'T3', exerciseName: 'Lat Pulldown', suggestedWeight: 80 },
      { reps: 25, hitAllReps: false },
    );
    expect(result.suggestedWeight).toBe(85);
    expect(result.newStage).toBeNull();
  });

  it('last set reps = 24 → weight stays the same', () => {
    const result = resolveGZCLP(
      { tier: 'T3', exerciseName: 'Lat Pulldown', suggestedWeight: 80 },
      { reps: 24, hitAllReps: false },
    );
    expect(result.suggestedWeight).toBe(80);
    expect(result.newStage).toBeNull();
  });
});

// --- seedT2Weight ---

describe('seedT2Weight', () => {
  it('returns 65% of T1 rounded to nearest 5', () => {
    expect(seedT2Weight(185)).toBe(120);
    expect(seedT2Weight(95)).toBe(60);
  });

  it('floors at 45 (empty bar)', () => {
    expect(seedT2Weight(45)).toBe(45);
    expect(seedT2Weight(30)).toBe(45);
  });
});

// --- T1/T2 weight independence ---

const gzclpPlan: WorkoutPlan = {
  id: 'p-gzclp',
  userId: 'u1',
  weekNumber: 1,
  startDate: '2026-01-01',
  endDate: '2026-01-07',
  createdBy: 'ai',
  conversationId: 'c1',
  progressionMode: 'gzclp',
  exercises: [
    // A2 session: Bench as T1
    {
      id: 'e-bench-t1',
      planId: 'p-gzclp',
      exerciseName: 'Bench Press',
      tier: 'T1',
      stage: 0,
      suggestedWeight: 185,
      targetSets: 5,
      targetReps: 3,
      dayOfWeek: 2,
      order: 0,
    },
    // A1 session: Bench as T2
    {
      id: 'e-bench-t2',
      planId: 'p-gzclp',
      exerciseName: 'Bench Press',
      tier: 'T2',
      stage: 0,
      suggestedWeight: 120,
      targetSets: 3,
      targetReps: 10,
      dayOfWeek: 0,
      order: 1,
    },
    // A1 session: Squat as T1
    {
      id: 'e-squat-t1',
      planId: 'p-gzclp',
      exerciseName: 'Squat',
      tier: 'T1',
      stage: 0,
      suggestedWeight: 135,
      targetSets: 5,
      targetReps: 3,
      dayOfWeek: 0,
      order: 0,
    },
    // A2 session: Squat as T2
    {
      id: 'e-squat-t2',
      planId: 'p-gzclp',
      exerciseName: 'Squat',
      tier: 'T2',
      stage: 0,
      suggestedWeight: 95,
      targetSets: 3,
      targetReps: 10,
      dayOfWeek: 2,
      order: 1,
    },
  ],
};

describe('T1/T2 independence', () => {
  it('progressing bench T1 does not contaminate bench T2 suggestion', () => {
    // Only a T1 bench session exists
    const sessions: WorkoutSession[] = [
      {
        id: 's1',
        userId: 'u1',
        date: '2026-01-05',
        startTime: '2026-01-05T10:00:00Z',
        completed: true,
        sessionType: 'strength',
        loggedExercises: [
          {
            id: 'le1',
            sessionId: 's1',
            exerciseName: 'Bench Press',
            tier: 'T1',
            sets: [
              { setNumber: 1, reps: 5, weight: 185, completed: true, timestamp: '' },
              { setNumber: 2, reps: 5, weight: 185, completed: true, timestamp: '' },
              { setNumber: 3, reps: 5, weight: 185, completed: true, timestamp: '' },
              { setNumber: 4, reps: 5, weight: 185, completed: true, timestamp: '' },
              { setNumber: 5, reps: 7, weight: 185, completed: true, timestamp: '' },
            ],
          },
        ],
      },
    ];

    const result = resolveProgressionForPlan(gzclpPlan, sessions);
    expect(result.mode).toBe('gzclp');
    if (result.mode !== 'gzclp') return;

    const t1 = result.suggestions.find((s) => s.exerciseName === 'Bench Press' && s.tier === 'T1');
    const t2 = result.suggestions.find((s) => s.exerciseName === 'Bench Press' && s.tier === 'T2');

    // T1 bench succeeded at 185 → should advance to 190
    expect(t1?.suggestedWeight).toBe(190);
    // T2 bench has no matching history (session had T1 not T2) → not in suggestions
    expect(t2).toBeUndefined();
  });

  it('bench T2 advances independently on its own history', () => {
    // Only a T2 bench session exists
    const sessions: WorkoutSession[] = [
      {
        id: 's2',
        userId: 'u1',
        date: '2026-01-03',
        startTime: '2026-01-03T10:00:00Z',
        completed: true,
        sessionType: 'strength',
        loggedExercises: [
          {
            id: 'le2',
            sessionId: 's2',
            exerciseName: 'Bench Press',
            tier: 'T2',
            sets: [
              { setNumber: 1, reps: 10, weight: 120, completed: true, timestamp: '' },
              { setNumber: 2, reps: 10, weight: 120, completed: true, timestamp: '' },
              { setNumber: 3, reps: 10, weight: 120, completed: true, timestamp: '' },
            ],
          },
        ],
      },
    ];

    const result = resolveProgressionForPlan(gzclpPlan, sessions);
    expect(result.mode).toBe('gzclp');
    if (result.mode !== 'gzclp') return;

    const t2 = result.suggestions.find((s) => s.exerciseName === 'Bench Press' && s.tier === 'T2');
    const t1 = result.suggestions.find((s) => s.exerciseName === 'Bench Press' && s.tier === 'T1');

    // T2 bench succeeded at 120 → should advance to 125
    expect(t2?.suggestedWeight).toBe(125);
    // T1 has no history → not in suggestions
    expect(t1).toBeUndefined();
  });

  it('full A1->A2 cycle: squat T1 and T2 hold different weights and progress independently', () => {
    const sessions: WorkoutSession[] = [
      // A1: Squat as T1 at 135, 4 reps (success for T1 stage 0, min 3)
      {
        id: 'sA1',
        userId: 'u1',
        date: '2026-01-01',
        startTime: '2026-01-01T10:00:00Z',
        completed: true,
        sessionType: 'strength',
        loggedExercises: [
          {
            id: 'le-squat-t1',
            sessionId: 'sA1',
            exerciseName: 'Squat',
            tier: 'T1',
            sets: [
              { setNumber: 1, reps: 5, weight: 135, completed: true, timestamp: '' },
              { setNumber: 2, reps: 5, weight: 135, completed: true, timestamp: '' },
              { setNumber: 3, reps: 5, weight: 135, completed: true, timestamp: '' },
              { setNumber: 4, reps: 5, weight: 135, completed: true, timestamp: '' },
              { setNumber: 5, reps: 4, weight: 135, completed: true, timestamp: '' },
            ],
          },
        ],
      },
      // A2: Squat as T2 at 95, all 10 reps hit (success)
      {
        id: 'sA2',
        userId: 'u1',
        date: '2026-01-05',
        startTime: '2026-01-05T10:00:00Z',
        completed: true,
        sessionType: 'strength',
        loggedExercises: [
          {
            id: 'le-squat-t2',
            sessionId: 'sA2',
            exerciseName: 'Squat',
            tier: 'T2',
            sets: [
              { setNumber: 1, reps: 10, weight: 95, completed: true, timestamp: '' },
              { setNumber: 2, reps: 10, weight: 95, completed: true, timestamp: '' },
              { setNumber: 3, reps: 10, weight: 95, completed: true, timestamp: '' },
            ],
          },
        ],
      },
    ];

    const result = resolveProgressionForPlan(gzclpPlan, sessions);
    expect(result.mode).toBe('gzclp');
    if (result.mode !== 'gzclp') return;

    const sqT1 = result.suggestions.find((s) => s.exerciseName === 'Squat' && s.tier === 'T1');
    const sqT2 = result.suggestions.find((s) => s.exerciseName === 'Squat' && s.tier === 'T2');

    // Squat T1 (lower body): 135 + 10 = 145
    expect(sqT1?.suggestedWeight).toBe(145);
    // Squat T2 (lower body): 95 + 10 = 105
    expect(sqT2?.suggestedWeight).toBe(105);
    // They must diverge
    expect(sqT1?.suggestedWeight).not.toBe(sqT2?.suggestedWeight);
    // Stages remain independent (both still 0 after success)
    expect(sqT1?.newStage).toBe(0);
    expect(sqT2?.newStage).toBe(0);
  });
});

// --- strategy dispatcher: consistency plans must not invoke GZCLP ---

describe('resolveProgressionForPlan — consistency isolation', () => {
  it('passes consistency plan through suggestWeightsForPlan, never touches resolveGZCLP', () => {
    const plan: WorkoutPlan = {
      id: 'p1',
      userId: 'u1',
      weekNumber: 1,
      startDate: '2026-01-01',
      endDate: '2026-01-07',
      createdBy: 'ai',
      conversationId: 'c1',
      exercises: [
        {
          id: 'e1',
          planId: 'p1',
          exerciseName: 'Bench Press',
          targetSets: 4,
          targetReps: 8,
          dayOfWeek: 1,
          order: 1,
        },
      ],
    };

    const sessions: WorkoutSession[] = [];
    const result = resolveProgressionForPlan(plan, sessions);

    expect(result.mode).toBe('consistency');
    expect(suggestWeightsForPlan).toHaveBeenCalledWith(sessions, plan.exercises);
  });

  it('routes a gzclp plan to the gzclp path', () => {
    const plan: WorkoutPlan = {
      id: 'p2',
      userId: 'u1',
      weekNumber: 1,
      startDate: '2026-01-01',
      endDate: '2026-01-07',
      createdBy: 'ai',
      conversationId: 'c1',
      progressionMode: 'gzclp',
      exercises: [],
    };

    const result = resolveProgressionForPlan(plan, []);
    expect(result.mode).toBe('gzclp');
    // suggestWeightsForPlan was NOT called for this plan
    const callCount = (suggestWeightsForPlan as ReturnType<typeof vi.fn>).mock.calls.length;
    const allCallPlans = (suggestWeightsForPlan as ReturnType<typeof vi.fn>).mock.calls.map(
      (c: unknown[]) => c[1],
    );
    expect(allCallPlans).not.toContain(plan.exercises);
    void callCount; // suppress unused warning
  });
});
