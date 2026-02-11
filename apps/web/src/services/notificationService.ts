export function isNotificationSupported(): boolean {
  return 'Notification' in window;
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!isNotificationSupported()) return false;
  if (Notification.permission === 'granted') return true;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

export function showBrowserNotification(title: string, body: string): void {
  if (!isNotificationSupported() || Notification.permission !== 'granted') return;
  new Notification(title, { body });
}
