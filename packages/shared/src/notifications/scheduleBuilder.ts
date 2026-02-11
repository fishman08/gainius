import type { WorkoutPlan } from '../types';
import type { NotificationPreferences, ScheduledNotification } from '../types/notification';
import { getWorkoutDaysFromPlan, isPlanExpiringSoon } from './weekDetection';

let scheduleCounter = 0;

function nextId(): string {
  scheduleCounter += 1;
  return `notif-${Date.now()}-${scheduleCounter}`;
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function buildNotificationSchedule(
  plan: WorkoutPlan,
  prefs: NotificationPreferences,
): ScheduledNotification[] {
  if (!prefs.enabled) return [];

  const notifications: ScheduledNotification[] = [];
  const workoutDays = getWorkoutDaysFromPlan(plan);
  const allDays = [0, 1, 2, 3, 4, 5, 6];
  const restDays = allDays.filter((d) => !workoutDays.includes(d));

  if (prefs.workoutReminders) {
    for (const day of workoutDays) {
      notifications.push({
        id: nextId(),
        type: 'workout_day_reminder',
        title: 'Workout Day!',
        body: `Today is ${DAY_NAMES[day]} — time to train!`,
        scheduledFor: prefs.reminderTime,
        dayOfWeek: day,
        recurring: true,
      });
    }
  }

  if (prefs.restDayNotifications) {
    for (const day of restDays) {
      notifications.push({
        id: nextId(),
        type: 'rest_day',
        title: 'Rest Day',
        body: `Recovery day. Stay active with light movement!`,
        scheduledFor: prefs.reminderTime,
        dayOfWeek: day,
        recurring: true,
      });
    }
  }

  if (prefs.planUpdateReminders && isPlanExpiringSoon(plan, 1)) {
    notifications.push({
      id: nextId(),
      type: 'plan_update_reminder',
      title: 'Plan Update Available',
      body: 'Your weekly plan is ending soon. Chat with your AI Coach for next week!',
      scheduledFor: prefs.reminderTime,
      recurring: false,
    });
  }

  return notifications;
}
