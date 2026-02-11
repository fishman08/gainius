import {
  isPlanExpired,
  isPlanExpiringSoon,
  getDaysRemainingInPlan,
  getWorkoutDaysFromPlan,
  isWorkoutDay,
  isRestDay,
} from '../weekDetection';
import type { WorkoutPlan } from '../../types';

function localDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function makePlan(
  startDate: string,
  endDate: string,
  dayOfWeeks: number[] = [1, 3, 5],
): WorkoutPlan {
  return {
    id: 'plan-1',
    userId: 'user-1',
    weekNumber: 1,
    startDate,
    endDate,
    createdBy: 'ai',
    conversationId: 'conv-1',
    exercises: dayOfWeeks.map((day, i) => ({
      id: `ex-${i}`,
      planId: 'plan-1',
      exerciseName: `Exercise ${i}`,
      targetSets: 3,
      targetReps: 10,
      dayOfWeek: day,
      order: i,
    })),
  };
}

describe('weekDetection', () => {
  describe('isPlanExpired', () => {
    it('returns true when endDate is in the past', () => {
      const plan = makePlan('2020-01-01', '2020-01-07');
      expect(isPlanExpired(plan)).toBe(true);
    });

    it('returns false when endDate is in the future', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      const plan = makePlan('2020-01-01', localDateStr(futureDate));
      expect(isPlanExpired(plan)).toBe(false);
    });
  });

  describe('isPlanExpiringSoon', () => {
    it('returns true when plan ends within threshold', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const plan = makePlan('2020-01-01', localDateStr(tomorrow));
      expect(isPlanExpiringSoon(plan, 2)).toBe(true);
    });

    it('returns false when plan ended yesterday', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 2);
      const plan = makePlan('2020-01-01', yesterday.toISOString().split('T')[0]);
      expect(isPlanExpiringSoon(plan, 1)).toBe(false);
    });
  });

  describe('getDaysRemainingInPlan', () => {
    it('returns 0 for expired plans', () => {
      const plan = makePlan('2020-01-01', '2020-01-07');
      expect(getDaysRemainingInPlan(plan)).toBe(0);
    });

    it('returns positive number for future plans', () => {
      const future = new Date();
      future.setDate(future.getDate() + 5);
      const plan = makePlan('2020-01-01', localDateStr(future));
      expect(getDaysRemainingInPlan(plan)).toBeGreaterThan(0);
    });
  });

  describe('getWorkoutDaysFromPlan', () => {
    it('returns unique sorted day numbers', () => {
      const plan = makePlan('2020-01-01', '2020-01-07', [3, 1, 5, 1, 3]);
      expect(getWorkoutDaysFromPlan(plan)).toEqual([1, 3, 5]);
    });
  });

  describe('isWorkoutDay / isRestDay', () => {
    it('isWorkoutDay and isRestDay are complementary', () => {
      const plan = makePlan('2020-01-01', '2020-01-07', [0, 1, 2, 3, 4, 5, 6]);
      expect(isWorkoutDay(plan)).toBe(true);
      expect(isRestDay(plan)).toBe(false);
    });
  });
});
