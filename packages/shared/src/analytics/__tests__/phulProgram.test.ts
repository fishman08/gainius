import { describe, it, expect } from 'vitest';
import { PHUL_ROTATION, buildPhulPlan } from '../phulProgram';
import { GZCLP_ROTATION } from '../gzclpProgression';
import { resolveProgressionForPlan } from '../progressionStrategy';
import { suggestWeightsForPlan } from '../weightSuggestion';
import {
  findSuggestionForExercise,
  getRotationLabel,
  getSessionExercises,
  isRotationPlan,
  nextRotationIndex,
} from '../programTemplate';
import type { PlannedExercise, WorkoutPlan, WorkoutSession } from '../../types';

type LoggedInput = { planned: PlannedExercise; weight: number; reps: number[] };

function makeSession(date: string, logged: LoggedInput[]): WorkoutSession {
  return {
    id: `session-${date}`,
    userId: 'u1',
    date,
    startTime: `${date}T10:00:00Z`,
    completed: true,
    sessionType: 'strength',
    loggedExercises: logged.map(({ planned, weight, reps }) => ({
      id: `le-${planned.id}-${date}`,
      sessionId: `session-${date}`,
      plannedExerciseId: planned.id,
      exerciseName: planned.exerciseName,
      sets: reps.map((r, i) => ({
        setNumber: i + 1,
        reps: r,
        weight,
        completed: true,
        timestamp: '',
      })),
    })),
  };
}

function find(plan: WorkoutPlan, name: string, day: number): PlannedExercise {
  const ex = plan.exercises.find((e) => e.exerciseName === name && e.dayOfWeek === day);
  if (!ex) throw new Error(`${name} not on day ${day}`);
  return ex;
}

/** Two identical sessions — the consistency engine needs at least 2 to suggest. */
function twoSessions(logged: LoggedInput[]): WorkoutSession[] {
  return [makeSession('2026-09-01', logged), makeSession('2026-09-08', logged)];
}

describe('PHUL template', () => {
  const plan = buildPhulPlan('u1', '2026-09-27');

  it('instantiates as a consistency plan with a 4-day rotation starting at day 0', () => {
    expect(plan.progressionMode).toBe('consistency');
    expect(plan.programTemplate).toBe('phul');
    expect(plan.rotationIndex).toBe(0);
    expect(PHUL_ROTATION.map((d) => d.label)).toEqual([
      'Upper Power',
      'Lower Power',
      'Upper Hypertrophy',
      'Lower Hypertrophy',
    ]);
    for (let day = 0; day < 4; day++) {
      expect(plan.exercises.filter((e) => e.dayOfWeek === day)).toHaveLength(7);
    }
    expect(plan.exercises).toHaveLength(28);
    expect(new Set(plan.exercises.map((e) => e.id)).size).toBe(28);
    expect(plan.exercises.every((e) => e.planId === plan.id)).toBe(true);
  });

  it('carries exact sets × reps for each day', () => {
    const summary = (day: number) =>
      plan.exercises
        .filter((e) => e.dayOfWeek === day)
        .sort((a, b) => a.order - b.order)
        .map((e) => `${e.exerciseName} ${e.targetSets}x${e.targetReps}`);

    expect(summary(0)).toEqual([
      'Bench Press 4x5',
      'Chest-Supported Row 4x5',
      'Overhead Press 3x6',
      'Pull-ups 3x8',
      'Lateral Raise 3x15',
      'Overhead Cable Tri Ext 3x10',
      'Hammer Curl 3x8',
    ]);
    expect(summary(1)).toEqual([
      'Squat 4x5',
      'Romanian Deadlift 3x6',
      'Leg Press 3x10',
      'Hip Thrust 3x8',
      'Seated Leg Curl 3x10',
      'Standing Calf Raise 3x12',
      'Hanging Leg Raise 3x12',
    ]);
    expect(summary(2)).toEqual([
      'Incline DB Press 4x12',
      'Seated Cable Row 4x12',
      'DB Shoulder Press 3x12',
      'Lateral Raise 4x15',
      'Face Pulls 3x20',
      'Tricep Pushdown 3x12',
      'Incline DB Curl 3x12',
    ]);
    expect(summary(3)).toEqual([
      'Hip Thrust 4x12',
      'Bulgarian Split Squat 3x10',
      'Lying Leg Curl 3x12',
      'Cable Kickback/Abduction 3x15',
      'Seated Calf Raise 3x15',
      'Cable Woodchop 3x12',
      'Side Plank 3x12',
    ]);
  });

  it('stores numeric targetReps on every exercise and notes for per-side / bodyweight moves', () => {
    expect(plan.exercises.every((e) => typeof e.targetReps === 'number')).toBe(true);
    expect(find(plan, 'Bulgarian Split Squat', 3).notes).toBe('Per leg');
    expect(find(plan, 'Pull-ups', 0).notes).toMatch(/Bodyweight/);
  });
});

describe('PHUL — consistency engine judges each lift against its own targetReps', () => {
  const plan = buildPhulPlan('u1', '2026-09-27');
  const bench = find(plan, 'Bench Press', 0); // 4 × 5
  const curl = find(plan, 'Incline DB Curl', 2); // 3 × 12

  it('bench at 5/5/5/5 progresses', () => {
    const history = twoSessions([{ planned: bench, weight: 185, reps: [5, 5, 5, 5] }]);
    const result = resolveProgressionForPlan(plan, history);
    expect(result.mode).toBe('consistency');
    const s = findSuggestionForExercise(result.suggestions, bench);
    expect(s?.direction).toBe('increase');
    expect(s!.suggestedWeight).toBeGreaterThan(185);
  });

  it('curl at 12/12/12 progresses', () => {
    const history = twoSessions([{ planned: curl, weight: 25, reps: [12, 12, 12] }]);
    const s = findSuggestionForExercise(resolveProgressionForPlan(plan, history).suggestions, curl);
    expect(s?.direction).toBe('increase');
  });

  it('curl at 9/9/9 does not progress', () => {
    const history = twoSessions([{ planned: curl, weight: 25, reps: [9, 9, 9] }]);
    const s = findSuggestionForExercise(resolveProgressionForPlan(plan, history).suggestions, curl);
    expect(s).toBeDefined();
    expect(s!.direction).not.toBe('increase');
    expect(s!.suggestedWeight).toBeLessThanOrEqual(25);
  });

  it('bench at 5/5/5/5 and curl at 9/9/9 in the same sessions are judged independently', () => {
    const history = twoSessions([
      { planned: bench, weight: 185, reps: [5, 5, 5, 5] },
      { planned: curl, weight: 25, reps: [9, 9, 9] },
    ]);
    const { suggestions } = resolveProgressionForPlan(plan, history);
    expect(findSuggestionForExercise(suggestions, bench)?.direction).toBe('increase');
    expect(findSuggestionForExercise(suggestions, curl)?.direction).not.toBe('increase');
  });

  it('keeps the two Hip Thrust slots (3 × 8 vs 4 × 12) separate', () => {
    const powerHip = find(plan, 'Hip Thrust', 1);
    const hyperHip = find(plan, 'Hip Thrust', 3);
    const history = twoSessions([
      { planned: powerHip, weight: 225, reps: [8, 8, 8] },
      { planned: hyperHip, weight: 135, reps: [10, 10, 10, 10] },
    ]);
    const { suggestions } = resolveProgressionForPlan(plan, history);
    const power = findSuggestionForExercise(suggestions, powerHip);
    const hyper = findSuggestionForExercise(suggestions, hyperHip);
    expect(power?.plannedExerciseId).toBe(powerHip.id);
    expect(power?.currentWeight).toBe(225);
    expect(power?.direction).toBe('increase');
    expect(hyper?.plannedExerciseId).toBe(hyperHip.id);
    expect(hyper?.currentWeight).toBe(135);
    expect(hyper?.direction).not.toBe('increase');
  });

  it('non-PHUL consistency plans keep the inferred-target behavior', () => {
    // Same 9/9/9 curl history, but on an AI-created plan with no template.
    const aiPlan: WorkoutPlan = { ...plan, programTemplate: undefined, rotationIndex: undefined };
    const history = twoSessions([{ planned: curl, weight: 25, reps: [9, 9, 9] }]);
    const s = resolveProgressionForPlan(aiPlan, history).suggestions.find(
      (x) => x.exerciseName === 'Incline DB Curl',
    );
    expect(s?.direction).toBe('increase');
    expect(s?.plannedExerciseId).toBeUndefined();
    expect(suggestWeightsForPlan(history, [curl])[0].direction).toBe('increase');
  });
});

describe('PHUL rotation', () => {
  it('advances 1 → 2 → 3 → 4 → 1 across completed sessions', () => {
    let plan = buildPhulPlan('u1', '2026-09-27');
    const served: string[] = [];
    for (let i = 0; i < 5; i++) {
      served.push(getRotationLabel(plan)!);
      const today = getSessionExercises(plan);
      expect(today).toHaveLength(7);
      expect(today.every((e) => e.dayOfWeek === plan.rotationIndex)).toBe(true);
      // Mirrors saveSession on completion
      plan = { ...plan, rotationIndex: nextRotationIndex(plan) };
    }
    expect(served).toEqual([
      'Upper Power',
      'Lower Power',
      'Upper Hypertrophy',
      'Lower Hypertrophy',
      'Upper Power',
    ]);
  });

  it('treats plans without a template or gzclp mode as non-rotating', () => {
    const aiPlan: WorkoutPlan = {
      ...buildPhulPlan('u1', '2026-09-27'),
      programTemplate: undefined,
    };
    expect(isRotationPlan(aiPlan)).toBe(false);
    expect(getSessionExercises(aiPlan)).toHaveLength(28);
    expect(getRotationLabel(aiPlan)).toBeNull();
  });
});

describe('PHUL does not affect GZCLP', () => {
  function gzclpPlan(rotationIndex = 0): WorkoutPlan {
    const exercises: PlannedExercise[] = [];
    GZCLP_ROTATION.forEach((session, day) =>
      session.exercises.forEach((ex, order) =>
        exercises.push({
          id: `g-${day}-${order}`,
          planId: 'g',
          exerciseName: ex.exerciseName,
          tier: ex.tier,
          stage: 0,
          targetSets: ex.tier === 'T1' ? 5 : 3,
          targetReps: ex.tier === 'T1' ? 3 : ex.tier === 'T2' ? 10 : 15,
          suggestedWeight: 100,
          dayOfWeek: day,
          order,
        }),
      ),
    );
    return {
      id: 'g',
      userId: 'u1',
      weekNumber: 1,
      startDate: '2026-09-27',
      endDate: '2026-09-27',
      createdBy: 'manual',
      exercises,
      conversationId: '',
      progressionMode: 'gzclp',
      rotationIndex,
    };
  }

  it('leaves GZCLP_ROTATION and GZCLP resolution unchanged after building PHUL', () => {
    const rotationBefore = JSON.stringify(GZCLP_ROTATION);
    const g = gzclpPlan();
    const squat = g.exercises[0];
    const history = [
      makeSession('2026-09-01', [{ planned: squat, weight: 200, reps: [3, 3, 3, 3, 4] }]),
    ];
    history[0].loggedExercises[0].tier = 'T1';
    const before = resolveProgressionForPlan(g, history);

    buildPhulPlan('u1');

    expect(JSON.stringify(GZCLP_ROTATION)).toBe(rotationBefore);
    const after = resolveProgressionForPlan(g, history);
    expect(after).toEqual(before);
    expect(after.mode).toBe('gzclp');
  });

  it('keeps GZCLP day selection, labels, and 4-step wrap identical to the old inline logic', () => {
    for (let i = 0; i < 4; i++) {
      const g = gzclpPlan(i);
      expect(isRotationPlan(g)).toBe(true);
      expect(getSessionExercises(g)).toEqual(g.exercises.filter((ex) => ex.dayOfWeek === i));
      expect(getRotationLabel(g)).toBe(GZCLP_ROTATION[i].label);
      expect(nextRotationIndex(g)).toBe((i + 1) % 4);
    }
  });
});
