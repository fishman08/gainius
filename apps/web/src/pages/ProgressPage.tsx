import { useEffect, useMemo, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '../store';
import { useStorage } from '../providers/StorageProvider';
import { loadHistory } from '../store/slices/workoutSlice';
import type { TimePeriod } from '@fitness-tracker/shared';
import {
  filterByPeriod,
  computeStats,
  computeWeeklyVolume,
  getRecentPRs,
  getUniqueExercises,
} from '@fitness-tracker/shared';
import { StatCard } from '../components/progress/StatCard';
import { PeriodSelector } from '../components/progress/PeriodSelector';
import { VolumeChart } from '../components/progress/VolumeChart';
import { RecentPRsList } from '../components/progress/RecentPRsList';
import { ExerciseListSection } from '../components/progress/ExerciseListSection';
import { ExerciseDetailView } from '../components/progress/ExerciseDetailView';
import { useUserId } from '../hooks/useUserId';

export default function ProgressPage() {
  const dispatch = useDispatch<AppDispatch>();
  const storage = useStorage();
  const userId = useUserId();
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

  if (selectedExercise) {
    return (
      <div style={{ maxWidth: 800, margin: '20px auto', padding: 16 }}>
        <ExerciseDetailView
          exerciseName={selectedExercise}
          sessions={filtered}
          onBack={() => setSelectedExercise(null)}
        />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 800, margin: '20px auto', padding: 16 }}>
      <h1 style={{ marginTop: 0, marginBottom: 20 }}>Progress</h1>

      <PeriodSelector value={period} onChange={setPeriod} />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 12,
          marginBottom: 24,
        }}
      >
        <StatCard label="Workouts" value={stats.totalWorkouts} />
        <StatCard label="Total Volume" value={`${(stats.totalVolume / 1000).toFixed(1)}k lbs`} />
        <StatCard label="Total Sets" value={stats.totalSets} />
        <StatCard label="Avg/Week" value={stats.avgWorkoutsPerWeek} />
      </div>

      <VolumeChart data={weeklyVolume} />
      <RecentPRsList records={recentPRs} />
      <ExerciseListSection exercises={exercises} onSelect={setSelectedExercise} />

      {history.length === 0 && (
        <p style={{ color: '#999', textAlign: 'center', marginTop: 40 }}>
          Complete some workouts to see your progress here.
        </p>
      )}
    </div>
  );
}
