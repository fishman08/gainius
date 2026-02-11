import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { Text, SegmentedButtons, List, Chip } from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '../store';
import { useStorage } from '../providers/StorageProvider';
import { useAuth } from '../providers/AuthProvider';
import { loadHistory } from '../store/slices/workoutSlice';
import type { TimePeriod } from '@fitness-tracker/shared';
import {
  filterByPeriod,
  computeStats,
  computeWeeklyVolume,
  getRecentPRs,
  getUniqueExercises,
  computeExerciseAnalytics,
} from '@fitness-tracker/shared';
import StatCard from '../components/progress/StatCard';
import VolumeChart from '../components/progress/VolumeChart';
import ExerciseProgressChart from '../components/progress/ExerciseProgressChart';

export default function ProgressScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const storage = useStorage();
  const { user } = useAuth();
  const userId = user?.id ?? 'local-user';
  const history = useSelector((state: RootState) => state.workout.history);

  const [period, setPeriod] = useState<TimePeriod>('all');
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);

  useEffect(() => {
    dispatch(loadHistory({ storage, userId, limit: 200 }));
  }, [dispatch, storage, userId]);

  const filtered = useMemo(() => filterByPeriod(history, period), [history, period]);
  const stats = useMemo(() => computeStats(filtered), [filtered]);
  const weeklyVolume = useMemo(() => computeWeeklyVolume(filtered), [filtered]);
  const recentPRs = useMemo(() => getRecentPRs(history, 10), [history]);
  const exercises = useMemo(() => getUniqueExercises(filtered), [filtered]);
  const exerciseAnalytics = useMemo(
    () => (selectedExercise ? computeExerciseAnalytics(filtered, selectedExercise) : null),
    [filtered, selectedExercise],
  );

  if (selectedExercise && exerciseAnalytics) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Chip icon="arrow-left" onPress={() => setSelectedExercise(null)} style={styles.backChip}>
          Back to overview
        </Chip>

        <Text variant="headlineSmall" style={styles.heading}>
          {selectedExercise}
        </Text>

        <View style={styles.statRow}>
          <StatCard label="Best Weight" value={`${exerciseAnalytics.bestWeight} lbs`} />
          <View style={styles.statGap} />
          <StatCard label="Avg Weight" value={`${exerciseAnalytics.avgWeight} lbs`} />
        </View>
        <View style={styles.statRow}>
          <StatCard label="Sessions" value={exerciseAnalytics.sessionCount} />
          <View style={styles.statGap} />
          <StatCard label="Total Sets" value={exerciseAnalytics.totalSets} />
        </View>

        <ExerciseProgressChart analytics={exerciseAnalytics} />

        <Text variant="titleSmall" style={styles.sectionTitle}>
          Recent Sets
        </Text>
        {exerciseAnalytics.dataPoints
          .slice(-15)
          .reverse()
          .map((dp, i) => (
            <List.Item
              key={`${dp.date}-${i}`}
              title={`${dp.weight} lbs x ${dp.reps} reps`}
              description={dp.date}
            />
          ))}
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text variant="headlineMedium" style={styles.heading}>
        Progress
      </Text>

      <SegmentedButtons
        value={period}
        onValueChange={(v) => setPeriod(v as TimePeriod)}
        buttons={[
          { value: 'week', label: 'Week' },
          { value: 'month', label: 'Month' },
          { value: 'all', label: 'All' },
        ]}
        style={styles.segmented}
      />

      <View style={styles.statRow}>
        <StatCard label="Workouts" value={stats.totalWorkouts} />
        <View style={styles.statGap} />
        <StatCard label="Total Volume" value={`${(stats.totalVolume / 1000).toFixed(1)}k`} />
      </View>
      <View style={styles.statRow}>
        <StatCard label="Total Sets" value={stats.totalSets} />
        <View style={styles.statGap} />
        <StatCard label="Avg/Week" value={stats.avgWorkoutsPerWeek} />
      </View>

      <VolumeChart data={weeklyVolume} />

      {recentPRs.length > 0 && (
        <>
          <Text variant="titleSmall" style={styles.sectionTitle}>
            Personal Records
          </Text>
          {recentPRs.map((pr, i) => (
            <List.Item
              key={`${pr.exerciseName}-${pr.date}-${i}`}
              title={pr.exerciseName}
              description={`${pr.weight} lbs — ${pr.date}`}
              right={() =>
                pr.previousBest !== null ? (
                  <Text style={styles.prDelta}>+{pr.weight - pr.previousBest}</Text>
                ) : null
              }
            />
          ))}
        </>
      )}

      {exercises.length > 0 && (
        <>
          <Text variant="titleSmall" style={styles.sectionTitle}>
            Exercises
          </Text>
          {exercises.map((name) => (
            <List.Item
              key={name}
              title={name}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => setSelectedExercise(name)}
            />
          ))}
        </>
      )}

      {history.length === 0 && (
        <Text style={styles.emptyText}>Complete some workouts to see your progress here.</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 16, paddingBottom: 32 },
  heading: { marginBottom: 16 },
  segmented: { marginBottom: 20 },
  statRow: { flexDirection: 'row', marginBottom: 12 },
  statGap: { width: 12 },
  sectionTitle: { marginTop: 8, marginBottom: 4 },
  backChip: { alignSelf: 'flex-start', marginBottom: 12 },
  prDelta: { color: '#4CAF50', fontSize: 14, fontWeight: '600', alignSelf: 'center' },
  emptyText: { color: '#999', textAlign: 'center', marginTop: 40 },
});
