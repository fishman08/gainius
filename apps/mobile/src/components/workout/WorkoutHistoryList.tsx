import React, { useMemo } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import type { WorkoutSession } from '@fitness-tracker/shared';
import { useAppTheme } from '../../providers/ThemeProvider';

function computeVolume(session: WorkoutSession): number {
  return session.loggedExercises.reduce(
    (total, ex) => total + ex.sets.reduce((sv, s) => sv + (s.completed ? s.weight * s.reps : 0), 0),
    0,
  );
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (s > 0) return `${m}m ${s}s`;
  return `${m}m`;
}

interface Props {
  onSessionSelect?: (sessionId: string) => void;
}

export default function WorkoutHistoryList({ onSessionSelect }: Props) {
  const { theme } = useAppTheme();
  const history = useSelector((state: RootState) => state.workout.history);

  const themedStyles = useMemo(
    () => ({
      emptyText: { color: theme.colors.textHint },
      detail: { color: theme.colors.textSecondary },
      badge: {
        fontSize: 11,
        color: theme.colors.primary,
        fontWeight: '600' as const,
        textTransform: 'uppercase' as const,
      },
    }),
    [theme],
  );

  if (history.length === 0) {
    return (
      <View style={styles.empty}>
        <Text variant="bodyMedium" style={themedStyles.emptyText}>
          No workout history yet.
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={history}
      keyExtractor={(item) => item.id}
      scrollEnabled={false}
      renderItem={({ item }) => {
        const isCardio = item.sessionType === 'cardio';

        if (isCardio && item.cardioLog) {
          const { activityType, durationSeconds, distanceMeters } = item.cardioLog;
          const km = distanceMeters ? (distanceMeters / 1000).toFixed(2) : null;
          const paceStr = (() => {
            if (!distanceMeters || !durationSeconds) return null;
            const secsPerKm = durationSeconds / (distanceMeters / 1000);
            const pMin = Math.floor(secsPerKm / 60);
            const pSec = Math.round(secsPerKm % 60);
            return `${pMin}:${String(pSec).padStart(2, '0')} /km`;
          })();

          return (
            <Card
              style={styles.card}
              onPress={onSessionSelect ? () => onSessionSelect(item.id) : undefined}
            >
              <Card.Content>
                <Text variant="labelSmall" style={themedStyles.badge}>
                  {activityType.toUpperCase()}
                </Text>
                <Text variant="titleSmall">{item.date}</Text>
                <Text variant="bodySmall" style={[styles.detail, themedStyles.detail]}>
                  {formatDuration(durationSeconds)}
                  {km ? ` · ${km} km` : ''}
                  {paceStr ? ` · ${paceStr}` : ''}
                </Text>
              </Card.Content>
            </Card>
          );
        }

        return (
          <Card
            style={styles.card}
            onPress={onSessionSelect ? () => onSessionSelect(item.id) : undefined}
          >
            <Card.Content>
              <Text variant="titleSmall">{item.date}</Text>
              <Text variant="bodySmall" style={[styles.detail, themedStyles.detail]}>
                {item.loggedExercises.length} exercises
              </Text>
              <Text variant="bodySmall" style={[styles.detail, themedStyles.detail]}>
                Volume: {computeVolume(item).toLocaleString()} lbs
              </Text>
            </Card.Content>
          </Card>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  empty: {
    padding: 24,
    alignItems: 'center',
  },
  card: {
    marginBottom: 8,
  },
  detail: {
    marginTop: 2,
  },
});
