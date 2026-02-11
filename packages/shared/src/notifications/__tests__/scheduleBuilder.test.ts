import { describe, it, expect } from 'vitest';
import { buildNotificationSchedule } from '../scheduleBuilder';
import type { WorkoutPlan } from '../../types';
import type { NotificationPreferences } from '../../types/notification';

function makePlan(overrides?: Partial<WorkoutPlan>): WorkoutPlan {
  return {
    id: 'plan-1',
    userId: 'local-user',
    weekNumber: 1,
    startDate: '2026-02-02',
    endDate: '2026-02-08',
    createdBy: 'ai',
    exercises: [
      {
        id: 'e1',
        planId: 'plan-1',
        exerciseName: 'Bench Press',
        targetSets: 3,
        targetReps: 10,
        dayOfWeek: 1, // Monday
        order: 1,
      },
      {
        id: 'e2',
        planId: 'plan-1',
        exerciseName: 'Squat',
        targetSets: 3,
        targetReps: 5,
        dayOfWeek: 3, // Wednesday
        order: 1,
      },
    ],
    conversationId: 'conv-1',
    ...overrides,
  };
}

function makePrefs(overrides?: Partial<NotificationPreferences>): NotificationPreferences {
  return {
    enabled: true,
    workoutReminders: true,
    planUpdateReminders: true,
    restDayNotifications: true,
    achievementCelebrations: true,
    reminderTime: '09:00',
    quietHoursStart: null,
    quietHoursEnd: null,
    ...overrides,
  };
}

describe('buildNotificationSchedule', () => {
  it('returns empty array when notifications disabled', () => {
    const result = buildNotificationSchedule(makePlan(), makePrefs({ enabled: false }));
    expect(result).toEqual([]);
  });

  it('creates workout day reminders', () => {
    const result = buildNotificationSchedule(
      makePlan(),
      makePrefs({ restDayNotifications: false, planUpdateReminders: false }),
    );
    const workoutReminders = result.filter((n) => n.type === 'workout_day_reminder');
    expect(workoutReminders).toHaveLength(2); // Monday and Wednesday
    expect(workoutReminders[0].dayOfWeek).toBe(1);
    expect(workoutReminders[1].dayOfWeek).toBe(3);
    expect(workoutReminders[0].recurring).toBe(true);
    expect(workoutReminders[0].title).toBe('Workout Day!');
  });

  it('creates rest day notifications', () => {
    const result = buildNotificationSchedule(
      makePlan(),
      makePrefs({ workoutReminders: false, planUpdateReminders: false }),
    );
    const restNotifs = result.filter((n) => n.type === 'rest_day');
    // 7 days - 2 workout days = 5 rest days
    expect(restNotifs).toHaveLength(5);
    expect(restNotifs[0].title).toBe('Rest Day');
    expect(restNotifs[0].recurring).toBe(true);
  });

  it('creates plan update reminder when plan is expiring', () => {
    // Make plan end today or tomorrow
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const result = buildNotificationSchedule(
      makePlan({ endDate: todayStr }),
      makePrefs({ workoutReminders: false, restDayNotifications: false }),
    );
    const planReminders = result.filter((n) => n.type === 'plan_update_reminder');
    expect(planReminders).toHaveLength(1);
    expect(planReminders[0].recurring).toBe(false);
  });

  it('does not create plan update reminder when plan is not expiring', () => {
    const result = buildNotificationSchedule(
      makePlan({ endDate: '2030-12-31' }),
      makePrefs({ workoutReminders: false, restDayNotifications: false }),
    );
    const planReminders = result.filter((n) => n.type === 'plan_update_reminder');
    expect(planReminders).toHaveLength(0);
  });

  it('uses the configured reminder time', () => {
    const result = buildNotificationSchedule(
      makePlan(),
      makePrefs({ reminderTime: '07:30', restDayNotifications: false, planUpdateReminders: false }),
    );
    for (const notif of result) {
      expect(notif.scheduledFor).toBe('07:30');
    }
  });
});
