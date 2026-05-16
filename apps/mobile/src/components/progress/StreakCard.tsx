import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import type { WorkoutSession } from '@fitness-tracker/shared';

const WINDOW = 14;

function computeStreak(history: WorkoutSession[]): { streak: number; windowDays: number } {
  if (history.length === 0) return { streak: 0, windowDays: WINDOW };

  const uniqueDays = new Set(
    history.map((s) => {
      const d = new Date(s.startTime);
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    }),
  );

  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    if (uniqueDays.has(key)) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }

  return { streak, windowDays: WINDOW };
}

export default function StreakCard() {
  const history = useSelector((state: RootState) => state.workout.history);
  const { streak, windowDays } = useMemo(() => computeStreak(history), [history]);

  const filledDots = Math.min(streak, windowDays);

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.overline}>Current Streak</Text>
          <Text style={styles.count}>{streak} DAYS</Text>
        </View>
        <Text style={styles.flame}>🔥</Text>
      </View>
      <View style={styles.dotRow}>
        {Array.from({ length: windowDays }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              {
                backgroundColor:
                  i < filledDots ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.2)',
              },
            ]}
          />
        ))}
      </View>
      <Text style={styles.caption}>
        {filledDots} of {windowDays} days this fortnight
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#C2410C',
    borderRadius: 16,
    padding: 14,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  overline: {
    fontFamily: 'RethinkSans_700Bold',
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  count: {
    fontFamily: 'BarlowCondensed_700Bold',
    fontSize: 44,
    lineHeight: 44,
    color: '#fff',
    letterSpacing: -0.44,
  },
  flame: {
    fontFamily: 'BarlowCondensed_700Bold',
    fontSize: 52,
    lineHeight: 52,
    opacity: 0.22,
    marginTop: -4,
  },
  dotRow: {
    flexDirection: 'row',
    gap: 3,
    marginBottom: 5,
  },
  dot: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  caption: {
    fontFamily: 'RethinkSans_400Regular',
    fontSize: 11,
    color: 'rgba(255,255,255,0.65)',
  },
});
