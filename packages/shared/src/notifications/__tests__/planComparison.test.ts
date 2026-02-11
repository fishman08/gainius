import { comparePlans } from '../planComparison';
import type { WorkoutPlan } from '../../types';

function makePlan(
  exercises: Array<{ name: string; sets: number; reps: number; weight?: number }>,
): WorkoutPlan {
  return {
    id: 'plan-1',
    userId: 'user-1',
    weekNumber: 1,
    startDate: '2026-02-03',
    endDate: '2026-02-09',
    createdBy: 'ai',
    conversationId: 'conv-1',
    exercises: exercises.map((ex, i) => ({
      id: `ex-${i}`,
      planId: 'plan-1',
      exerciseName: ex.name,
      targetSets: ex.sets,
      targetReps: ex.reps,
      suggestedWeight: ex.weight,
      dayOfWeek: 1,
      order: i,
    })),
  };
}

describe('comparePlans', () => {
  it('detects added exercises', () => {
    const oldPlan = makePlan([{ name: 'Bench Press', sets: 3, reps: 8, weight: 135 }]);
    const newPlan = makePlan([
      { name: 'Bench Press', sets: 3, reps: 8, weight: 135 },
      { name: 'Overhead Press', sets: 3, reps: 10, weight: 65 },
    ]);
    const result = comparePlans(oldPlan, newPlan);
    const added = result.changes.filter((c) => c.changeType === 'added');
    expect(added).toHaveLength(1);
    expect(added[0].exerciseName).toBe('Overhead Press');
  });

  it('detects removed exercises', () => {
    const oldPlan = makePlan([
      { name: 'Bench Press', sets: 3, reps: 8 },
      { name: 'Squat', sets: 3, reps: 5 },
    ]);
    const newPlan = makePlan([{ name: 'Bench Press', sets: 3, reps: 8 }]);
    const result = comparePlans(oldPlan, newPlan);
    const removed = result.changes.filter((c) => c.changeType === 'removed');
    expect(removed).toHaveLength(1);
    expect(removed[0].exerciseName).toBe('Squat');
  });

  it('detects modified exercises', () => {
    const oldPlan = makePlan([{ name: 'Bench Press', sets: 3, reps: 8, weight: 135 }]);
    const newPlan = makePlan([{ name: 'Bench Press', sets: 4, reps: 8, weight: 140 }]);
    const result = comparePlans(oldPlan, newPlan);
    const modified = result.changes.filter((c) => c.changeType === 'modified');
    expect(modified).toHaveLength(1);
    expect(modified[0].details).toContain('Sets 3→4');
    expect(modified[0].details).toContain('Weight 135→140 lbs');
  });

  it('detects unchanged exercises', () => {
    const oldPlan = makePlan([{ name: 'Bench Press', sets: 3, reps: 8, weight: 135 }]);
    const newPlan = makePlan([{ name: 'Bench Press', sets: 3, reps: 8, weight: 135 }]);
    const result = comparePlans(oldPlan, newPlan);
    expect(result.changes[0].changeType).toBe('unchanged');
  });

  it('is case-insensitive for exercise name matching', () => {
    const oldPlan = makePlan([{ name: 'Bench Press', sets: 3, reps: 8 }]);
    const newPlan = makePlan([{ name: 'bench press', sets: 3, reps: 8 }]);
    const result = comparePlans(oldPlan, newPlan);
    expect(result.changes[0].changeType).toBe('unchanged');
  });

  it('includes claude reasoning when provided', () => {
    const plan = makePlan([{ name: 'Bench Press', sets: 3, reps: 8 }]);
    const result = comparePlans(plan, plan, 'Good progress this week');
    expect(result.claudeReasoning).toBe('Good progress this week');
  });

  it('includes plan summaries', () => {
    const plan = makePlan([
      { name: 'Bench Press', sets: 3, reps: 8 },
      { name: 'Squat', sets: 4, reps: 5 },
    ]);
    const result = comparePlans(plan, plan);
    expect(result.oldPlan.exerciseCount).toBe(2);
    expect(result.oldPlan.totalSets).toBe(7);
  });
});
