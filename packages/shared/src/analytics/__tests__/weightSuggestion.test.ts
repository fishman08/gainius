import { describe, it, expect } from 'vitest';
import { suggestWeight, suggestWeightsForPlan } from '../weightSuggestion';
import type { WorkoutSession, PlannedExercise } from '../../types';

function makeSession(
  date: string,
  exercises: { name: string; sets: { weight: number; reps: number; rpe?: number }[] }[],
): WorkoutSession {
  return {
    id: `session-${date}`,
    userId: 'local-user',
    date,
    startTime: `${date}T10:00:00Z`,
    completed: true,
    loggedExercises: exercises.map((ex) => ({
      id: `ex-${ex.name}-${date}`,
      sessionId: `session-${date}`,
      exerciseName: ex.name,
      sets: ex.sets.map((s, i) => ({
        setNumber: i + 1,
        reps: s.reps,
        weight: s.weight,
        completed: true,
        rpe: s.rpe,
        timestamp: '',
      })),
    })),
  };
}

describe('suggestWeight', () => {
  it('returns null for fewer than 2 sessions', () => {
    const sessions = [
      makeSession('2026-02-01', [{ name: 'Bench Press', sets: [{ weight: 135, reps: 10 }] }]),
    ];
    expect(suggestWeight(sessions, 'Bench Press')).toBeNull();
  });

  it('suggests increase for high consistency', () => {
    const sessions = [
      makeSession('2026-02-01', [
        {
          name: 'Bench Press',
          sets: [
            { weight: 135, reps: 10 },
            { weight: 135, reps: 10 },
            { weight: 135, reps: 10 },
          ],
        },
      ]),
      makeSession('2026-02-03', [
        {
          name: 'Bench Press',
          sets: [
            { weight: 135, reps: 10 },
            { weight: 135, reps: 10 },
            { weight: 135, reps: 10 },
          ],
        },
      ]),
      makeSession('2026-02-05', [
        {
          name: 'Bench Press',
          sets: [
            { weight: 135, reps: 10 },
            { weight: 135, reps: 10 },
            { weight: 135, reps: 10 },
          ],
        },
      ]),
    ];
    const result = suggestWeight(sessions, 'Bench Press');
    expect(result).not.toBeNull();
    expect(result!.direction).toBe('increase');
    expect(result!.suggestedWeight).toBeGreaterThan(135);
  });

  it('suggests same for medium consistency', () => {
    // 5 out of 6 sets hit target (83%) → between 0.7 and 0.9 → "same"
    const sessions = [
      makeSession('2026-02-01', [
        {
          name: 'Bench Press',
          sets: [
            { weight: 135, reps: 10 },
            { weight: 135, reps: 10 },
            { weight: 135, reps: 10 },
          ],
        },
      ]),
      makeSession('2026-02-03', [
        {
          name: 'Bench Press',
          sets: [
            { weight: 135, reps: 10 },
            { weight: 135, reps: 10 },
            { weight: 135, reps: 8 },
          ],
        },
      ]),
      makeSession('2026-02-05', [
        {
          name: 'Bench Press',
          sets: [
            { weight: 135, reps: 10 },
            { weight: 135, reps: 8 },
            { weight: 135, reps: 10 },
          ],
        },
      ]),
    ];
    const result = suggestWeight(sessions, 'Bench Press');
    expect(result).not.toBeNull();
    // 7 out of 9 sets hit target (78%) → "same"
    expect(result!.direction).toBe('same');
  });

  it('suggests decrease for low consistency', () => {
    const sessions = [
      makeSession('2026-02-01', [
        {
          name: 'Bench Press',
          sets: [
            { weight: 135, reps: 5 },
            { weight: 135, reps: 4 },
            { weight: 135, reps: 3 },
          ],
        },
      ]),
      makeSession('2026-02-03', [
        {
          name: 'Bench Press',
          sets: [
            { weight: 135, reps: 6 },
            { weight: 135, reps: 4 },
            { weight: 135, reps: 3 },
          ],
        },
      ]),
    ];
    const result = suggestWeight(sessions, 'Bench Press');
    expect(result).not.toBeNull();
    expect(result!.direction).toBe('decrease');
    expect(result!.suggestedWeight).toBeLessThanOrEqual(135);
  });

  it('suggests same for high RPE even with consistent reps', () => {
    const sessions = [
      makeSession('2026-02-01', [
        {
          name: 'Bench Press',
          sets: [
            { weight: 135, reps: 10, rpe: 9.5 },
            { weight: 135, reps: 10, rpe: 9.5 },
          ],
        },
      ]),
      makeSession('2026-02-03', [
        {
          name: 'Bench Press',
          sets: [
            { weight: 135, reps: 10, rpe: 9.5 },
            { weight: 135, reps: 10, rpe: 9.5 },
          ],
        },
      ]),
    ];
    const result = suggestWeight(sessions, 'Bench Press');
    expect(result).not.toBeNull();
    expect(result!.direction).toBe('same');
    expect(result!.reason).toContain('RPE');
  });

  it('rounds weight to nearest 2.5', () => {
    const sessions = [
      makeSession('2026-02-01', [
        {
          name: 'Bench Press',
          sets: [
            { weight: 100, reps: 10 },
            { weight: 100, reps: 10 },
          ],
        },
      ]),
      makeSession('2026-02-03', [
        {
          name: 'Bench Press',
          sets: [
            { weight: 100, reps: 10 },
            { weight: 100, reps: 10 },
          ],
        },
      ]),
      makeSession('2026-02-05', [
        {
          name: 'Bench Press',
          sets: [
            { weight: 100, reps: 10 },
            { weight: 100, reps: 10 },
          ],
        },
      ]),
    ];
    const result = suggestWeight(sessions, 'Bench Press');
    expect(result).not.toBeNull();
    expect(result!.suggestedWeight % 2.5).toBe(0);
  });
});

describe('suggestWeightsForPlan', () => {
  it('returns per-exercise suggestions', () => {
    const sessions = [
      makeSession('2026-02-01', [
        {
          name: 'Bench Press',
          sets: [
            { weight: 135, reps: 10 },
            { weight: 135, reps: 10 },
          ],
        },
        {
          name: 'Squat',
          sets: [
            { weight: 225, reps: 5 },
            { weight: 225, reps: 5 },
          ],
        },
      ]),
      makeSession('2026-02-03', [
        {
          name: 'Bench Press',
          sets: [
            { weight: 135, reps: 10 },
            { weight: 135, reps: 10 },
          ],
        },
        {
          name: 'Squat',
          sets: [
            { weight: 225, reps: 5 },
            { weight: 225, reps: 5 },
          ],
        },
      ]),
    ];

    const exercises: PlannedExercise[] = [
      {
        id: '1',
        planId: 'p1',
        exerciseName: 'Bench Press',
        targetSets: 3,
        targetReps: 10,
        dayOfWeek: 1,
        order: 1,
      },
      {
        id: '2',
        planId: 'p1',
        exerciseName: 'Squat',
        targetSets: 3,
        targetReps: 5,
        dayOfWeek: 1,
        order: 2,
      },
    ];

    const result = suggestWeightsForPlan(sessions, exercises);
    expect(result.length).toBe(2);
    expect(result[0].exerciseName).toBe('Bench Press');
    expect(result[1].exerciseName).toBe('Squat');
  });

  it('skips exercises with insufficient history', () => {
    const sessions = [
      makeSession('2026-02-01', [{ name: 'Bench Press', sets: [{ weight: 135, reps: 10 }] }]),
    ];

    const exercises: PlannedExercise[] = [
      {
        id: '1',
        planId: 'p1',
        exerciseName: 'Bench Press',
        targetSets: 3,
        targetReps: 10,
        dayOfWeek: 1,
        order: 1,
      },
    ];

    const result = suggestWeightsForPlan(sessions, exercises);
    expect(result).toHaveLength(0);
  });
});
