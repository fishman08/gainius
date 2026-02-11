import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Switch, Text, TextInput } from 'react-native-paper';
import type { NotificationPreferences } from '@fitness-tracker/shared';
import { DEFAULT_NOTIFICATION_PREFERENCES } from '@fitness-tracker/shared';
import { getNotificationPrefs, saveNotificationPrefs } from '../../services/secureStorage';
import {
  requestNotificationPermissions,
  cancelAllScheduled,
} from '../../services/notificationService';

export default function NotificationSettings() {
  const [prefs, setPrefs] = useState<NotificationPreferences>({
    ...DEFAULT_NOTIFICATION_PREFERENCES,
  });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getNotificationPrefs().then((p) => {
      setPrefs(p);
      setLoaded(true);
    });
  }, []);

  const updatePref = useCallback(
    <K extends keyof NotificationPreferences>(key: K, value: NotificationPreferences[K]) => {
      setPrefs((prev) => {
        const next = { ...prev, [key]: value };
        saveNotificationPrefs(next);
        return next;
      });
    },
    [],
  );

  const handleEnabledToggle = useCallback(
    async (value: boolean) => {
      if (value) {
        const granted = await requestNotificationPermissions();
        if (!granted) return;
      } else {
        await cancelAllScheduled();
      }
      updatePref('enabled', value);
    },
    [updatePref],
  );

  if (!loaded) return null;

  return (
    <Card style={styles.card}>
      <Card.Title title="Notifications" />
      <Card.Content>
        <Row label="Enable Notifications" value={prefs.enabled} onToggle={handleEnabledToggle} />
        {prefs.enabled && (
          <>
            <Row
              label="Workout Reminders"
              value={prefs.workoutReminders}
              onToggle={(v) => updatePref('workoutReminders', v)}
            />
            <Row
              label="Plan Update Reminders"
              value={prefs.planUpdateReminders}
              onToggle={(v) => updatePref('planUpdateReminders', v)}
            />
            <Row
              label="Rest Day Notifications"
              value={prefs.restDayNotifications}
              onToggle={(v) => updatePref('restDayNotifications', v)}
            />
            <Row
              label="Achievement Celebrations"
              value={prefs.achievementCelebrations}
              onToggle={(v) => updatePref('achievementCelebrations', v)}
            />
            <View style={styles.timeRow}>
              <Text variant="bodyMedium">Reminder Time</Text>
              <TextInput
                mode="outlined"
                dense
                value={prefs.reminderTime}
                onChangeText={(t) => {
                  if (/^\d{0,2}:?\d{0,2}$/.test(t)) updatePref('reminderTime', t);
                }}
                placeholder="09:00"
                style={styles.timeInput}
              />
            </View>
          </>
        )}
      </Card.Content>
    </Card>
  );
}

function Row({
  label,
  value,
  onToggle,
}: {
  label: string;
  value: boolean;
  onToggle: (v: boolean) => void;
}) {
  return (
    <View style={styles.row}>
      <Text variant="bodyMedium">{label}</Text>
      <Switch value={value} onValueChange={onToggle} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 16 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  timeInput: { width: 80 },
});
