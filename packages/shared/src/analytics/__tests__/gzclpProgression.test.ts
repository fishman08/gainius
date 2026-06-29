import { describe, it, expect, vi } from 'vitest';
import { resolveGZCLP } from '../gzclpProgression';
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
