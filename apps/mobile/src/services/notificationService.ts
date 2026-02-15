import * as Notifications from 'expo-notifications';
import type { ScheduledNotification } from '@fitness-tracker/shared';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function cancelAllScheduled(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function scheduleWeeklyNotification(
  notification: ScheduledNotification,
  hours: number,
  minutes: number,
): Promise<void> {
  if (notification.dayOfWeek == null) return;
  // expo-notifications uses 1=Sunday..7=Saturday
  const expoWeekday = notification.dayOfWeek === 0 ? 1 : notification.dayOfWeek + 1;
  await Notifications.scheduleNotificationAsync({
    content: { title: notification.title, body: notification.body },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: expoWeekday,
      hour: hours,
      minute: minutes,
    },
  });
}

export async function scheduleOneTimeNotification(
  notification: ScheduledNotification,
  date: Date,
): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: { title: notification.title, body: notification.body },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date },
  });
}

export async function showImmediateNotification(title: string, body: string): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: { title, body },
    trigger: null,
  });
}

const TIMER_WARNING_ID = 'rest-timer-warning';
const TIMER_COMPLETE_ID = 'rest-timer-complete';

export async function scheduleTimerWarning(seconds: number): Promise<void> {
  const warningDelay = Math.max(seconds - 10, 0);
  if (warningDelay <= 0) return;
  await Notifications.scheduleNotificationAsync({
    identifier: TIMER_WARNING_ID,
    content: { title: 'Rest Timer', body: '10 seconds remaining', sound: true },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: new Date(Date.now() + warningDelay * 1000),
    },
  });
}

export async function scheduleTimerComplete(seconds: number): Promise<void> {
  if (seconds <= 0) return;
  await Notifications.scheduleNotificationAsync({
    identifier: TIMER_COMPLETE_ID,
    content: { title: 'Rest Timer', body: 'Time to get back to work!', sound: true },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: new Date(Date.now() + seconds * 1000),
    },
  });
}

export async function cancelTimerNotifications(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(TIMER_WARNING_ID).catch(() => {});
  await Notifications.cancelScheduledNotificationAsync(TIMER_COMPLETE_ID).catch(() => {});
}
