import { describe, it, expect, vi } from 'vitest';
import { normalizeHistoricalExercises } from '../exerciseNormalization';
import type { StorageService } from '../../storage';
import type { WorkoutSession } from '../../types';

function makeMockStorage(sessions: WorkoutSession[]): StorageService {
  return {
    getWorkoutHistory: vi.fn().mockResolvedValue(sessions),
    saveWorkoutSession: vi.fn().mockResolvedValue(undefined),
  } as unknown as StorageService;
}

describe('normalizeHistoricalExercises', () => {
  it('normalizes known aliases to canonical names', async () => {
    const sessions: WorkoutSession[] = [
      {
        id: 's1',
        userId: 'u1',
        date: '2026-01-01',
        startTime: '',
        completed: true,
        loggedExercises: [
          { id: 'e1', sessionId: 's1', exerciseName: 'flat bench', sets: [] },
          { id: 'e2', sessionId: 's1', exerciseName: 'BB Row', sets: [] },
        ],
      },
    ];
    const storage = makeMockStorage(sessions);
    const result = await normalizeHistoricalExercises(storage, 'u1');

    expect(result.updated).toBe(1);
    expect(result.total).toBe(1);
    expect(sessions[0].loggedExercises[0].exerciseName).toBe('Bench Press');
    expect(sessions[0].loggedExercises[1].exerciseName).toBe('Barbell Row');
    expect(storage.saveWorkoutSession).toHaveBeenCalledWith(sessions[0]);
  });

  it('does not save unchanged sessions', async () => {
    const sessions: WorkoutSession[] = [
      {
        id: 's1',
        userId: 'u1',
        date: '2026-01-01',
        startTime: '',
        completed: true,
        loggedExercises: [{ id: 'e1', sessionId: 's1', exerciseName: 'Bench Press', sets: [] }],
      },
    ];
    const storage = makeMockStorage(sessions);
    const result = await normalizeHistoricalExercises(storage, 'u1');

    expect(result.updated).toBe(0);
    expect(result.total).toBe(1);
    expect(storage.saveWorkoutSession).not.toHaveBeenCalled();
  });

  it('preserves custom exercise names', async () => {
    const sessions: WorkoutSession[] = [
      {
        id: 's1',
        userId: 'u1',
        date: '2026-01-01',
        startTime: '',
        completed: true,
        loggedExercises: [
          { id: 'e1', sessionId: 's1', exerciseName: 'My Custom Exercise', sets: [] },
        ],
      },
    ];
    const storage = makeMockStorage(sessions);
    const result = await normalizeHistoricalExercises(storage, 'u1');

    expect(result.updated).toBe(0);
    expect(sessions[0].loggedExercises[0].exerciseName).toBe('My Custom Exercise');
  });

  it('handles empty history', async () => {
    const storage = makeMockStorage([]);
    const result = await normalizeHistoricalExercises(storage, 'u1');

    expect(result.updated).toBe(0);
    expect(result.total).toBe(0);
  });
});
