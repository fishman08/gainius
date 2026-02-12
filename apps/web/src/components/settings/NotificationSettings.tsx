import { useState, useEffect, useCallback } from 'react';
import type { NotificationPreferences } from '@fitness-tracker/shared';
import { DEFAULT_NOTIFICATION_PREFERENCES } from '@fitness-tracker/shared';
import { getNotificationPrefs, saveNotificationPrefs } from '../../services/apiKeyStorage';
import { requestNotificationPermission } from '../../services/notificationService';
import { useTheme } from '../../providers/ThemeProvider';

export function NotificationSettings() {
  const { theme } = useTheme();
  const [prefs, setPrefs] = useState<NotificationPreferences>({
    ...DEFAULT_NOTIFICATION_PREFERENCES,
  });

  useEffect(() => {
    setPrefs(getNotificationPrefs());
  }, []);

  const update = useCallback(
    <K extends keyof NotificationPreferences>(key: K, value: NotificationPreferences[K]) => {
      setPrefs((prev) => {
        const next = { ...prev, [key]: value };
        saveNotificationPrefs(next);
        return next;
      });
    },
    [],
  );

  const handleEnabledToggle = useCallback(async () => {
    const newVal = !prefs.enabled;
    if (newVal) {
      const granted = await requestNotificationPermission();
      if (!granted) return;
    }
    update('enabled', newVal);
  }, [prefs.enabled, update]);

  const checkboxStyle = { marginRight: 8, cursor: 'pointer' as const };
  const rowStyle = { display: 'flex', alignItems: 'center' as const, padding: '8px 0' };

  return (
    <div
      style={{
        background: theme.colors.surface,
        borderRadius: 12,
        padding: 24,
        border: `1px solid ${theme.colors.surfaceBorder}`,
        marginBottom: 16,
      }}
    >
      <h2 style={{ marginTop: 0, marginBottom: 8, color: theme.colors.text }}>Notifications</h2>
      <p style={{ color: theme.colors.textSecondary, fontSize: 14, marginBottom: 16 }}>
        Configure notification preferences for workout reminders and plan updates.
      </p>

      <div style={rowStyle}>
        <input
          type="checkbox"
          checked={prefs.enabled}
          onChange={handleEnabledToggle}
          style={checkboxStyle}
        />
        <label style={{ color: theme.colors.text }}>Enable Notifications</label>
      </div>

      {prefs.enabled && (
        <>
          <div style={rowStyle}>
            <input
              type="checkbox"
              checked={prefs.workoutReminders}
              onChange={() => update('workoutReminders', !prefs.workoutReminders)}
              style={checkboxStyle}
            />
            <label style={{ color: theme.colors.text }}>Workout Day Reminders</label>
          </div>
          <div style={rowStyle}>
            <input
              type="checkbox"
              checked={prefs.planUpdateReminders}
              onChange={() => update('planUpdateReminders', !prefs.planUpdateReminders)}
              style={checkboxStyle}
            />
            <label style={{ color: theme.colors.text }}>Plan Update Reminders</label>
          </div>
          <div style={rowStyle}>
            <input
              type="checkbox"
              checked={prefs.restDayNotifications}
              onChange={() => update('restDayNotifications', !prefs.restDayNotifications)}
              style={checkboxStyle}
            />
            <label style={{ color: theme.colors.text }}>Rest Day Notifications</label>
          </div>
          <div style={rowStyle}>
            <input
              type="checkbox"
              checked={prefs.achievementCelebrations}
              onChange={() => update('achievementCelebrations', !prefs.achievementCelebrations)}
              style={checkboxStyle}
            />
            <label style={{ color: theme.colors.text }}>Achievement Celebrations</label>
          </div>
          <div style={{ ...rowStyle, gap: 12 }}>
            <label style={{ color: theme.colors.text }}>Reminder Time:</label>
            <input
              type="time"
              value={prefs.reminderTime}
              onChange={(e) => update('reminderTime', e.target.value)}
              style={{
                padding: '6px 10px',
                border: `1px solid ${theme.colors.surfaceBorder}`,
                borderRadius: 6,
                fontSize: 14,
                backgroundColor: theme.colors.inputBackground,
                color: theme.colors.text,
              }}
            />
          </div>
        </>
      )}
    </div>
  );
}
