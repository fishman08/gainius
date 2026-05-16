import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, View, TouchableOpacity, Dimensions, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from 'react-native-paper';
import Svg, { Path, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
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
import { useAppTheme } from '../providers/ThemeProvider';

const PERIOD_TABS: { value: TimePeriod; label: string }[] = [
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'all', label: 'All Time' },
];

const LINE_H = 80;
const LINE_W_RATIO = 0.9;

function formatVolume(v: number): string {
  if (v >= 1000) return `${(v / 1000).toFixed(1)}K`;
  return String(v);
}

interface LineChartProps {
  points: number[];
  labels: string[];
  primaryColor: string;
  surfaceColor: string;
  hintColor: string;
  borderColor: string;
}

function LineChart({ points, labels, primaryColor, surfaceColor, hintColor }: LineChartProps) {
  const screenWidth = Dimensions.get('window').width;
  const W = (screenWidth - 32 - 28) * LINE_W_RATIO;
  const H = LINE_H;

  if (points.length < 2) return null;

  const mn = Math.min(...points);
  const mx = Math.max(...points, mn + 1);
  const coords: [number, number][] = points.map((v, i) => [
    (i / (points.length - 1)) * W,
    H - ((v - mn) / (mx - mn)) * H,
  ]);
  const lineD = coords.map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x} ${y}`).join(' ');
  const areaD = `${lineD} L ${W} ${H} L 0 ${H} Z`;

  return (
    <Svg width={W} height={H + 16}>
      <Defs>
        <LinearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={primaryColor} stopOpacity={0.2} />
          <Stop offset="100%" stopColor={primaryColor} stopOpacity={0} />
        </LinearGradient>
      </Defs>
      <Path d={areaD} fill="url(#lineGrad)" />
      <Path
        d={lineD}
        stroke={primaryColor}
        strokeWidth={2}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {coords.map(([x, y], i) => {
        const isLast = i === coords.length - 1;
        return (
          <Circle
            key={i}
            cx={x}
            cy={y}
            r={isLast ? 4 : 2.5}
            fill={isLast ? primaryColor : surfaceColor}
            stroke={primaryColor}
            strokeWidth={1.5}
          />
        );
      })}
      {labels.map((lbl, i) => {
        const [x] = coords[i];
        return (
          <Svg key={i}>
            <Path d={`M ${x} ${H + 4} L ${x} ${H + 12}`} stroke="transparent" />
          </Svg>
        );
      })}
    </Svg>
  );
}

export default function ProgressScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const storage = useStorage();
  const { user } = useAuth();
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const userId = user?.id ?? 'local-user';
  const history = useSelector((state: RootState) => state.workout.history);

  const [period, setPeriod] = useState<TimePeriod>('week');
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
      <ScrollView
        style={{ flex: 1, backgroundColor: theme.colors.background }}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      >
        <TouchableOpacity
          onPress={() => setSelectedExercise(null)}
          style={[styles.backBtn, { borderColor: theme.colors.surfaceBorder }]}
        >
          <Text style={[styles.backBtnText, { color: theme.colors.textSecondary }]}>← Back</Text>
        </TouchableOpacity>

        <Text style={[styles.screenTitle, { color: theme.colors.text }]}>
          {selectedExercise.toUpperCase()}
        </Text>

        <View style={styles.statsGrid}>
          <StatCard label="Best Weight" value={`${exerciseAnalytics.bestWeight} lbs`} highlight />
          <StatCard label="Avg Weight" value={`${exerciseAnalytics.avgWeight} lbs`} />
        </View>
        <View style={[styles.statsGrid, { marginTop: 10 }]}>
          <StatCard label="Sessions" value={exerciseAnalytics.sessionCount} />
          <StatCard label="Total Sets" value={exerciseAnalytics.totalSets} />
        </View>

        <View style={{ marginTop: 16 }}>
          <ExerciseProgressChart analytics={exerciseAnalytics} />
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Screen title */}
      <Text style={[styles.screenTitle, { color: theme.colors.text, paddingTop: insets.top + 12 }]}>
        PROGRESS
      </Text>

      {/* Period tabs */}
      <View style={[styles.periodTabRow, { borderBottomColor: theme.colors.surfaceBorder }]}>
        {PERIOD_TABS.map((tab) => {
          const active = period === tab.value;
          return (
            <TouchableOpacity
              key={tab.value}
              onPress={() => setPeriod(tab.value)}
              style={[
                styles.periodTab,
                {
                  borderBottomColor: active ? theme.colors.primary : 'transparent',
                  marginBottom: -1,
                },
              ]}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.periodTabText,
                  { color: active ? theme.colors.primary : theme.colors.textSecondary },
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Stats 2×2 grid */}
      <View style={styles.statsGrid}>
        <StatCard label="Volume · lbs" value={`${formatVolume(stats.totalVolume)}`} highlight />
        <StatCard label="Workouts" value={stats.totalWorkouts} />
      </View>
      <View style={[styles.statsGrid, { marginTop: 10, marginBottom: 14 }]}>
        <StatCard
          label="New PRs"
          value={recentPRs.filter((pr) => pr.previousBest === null).length}
          highlight
        />
        <StatCard label="Total Sets" value={stats.totalSets} />
      </View>

      {/* Volume bar chart */}
      <VolumeChart data={weeklyVolume} />

      {/* Bench Press line chart (first exercise with enough data) */}
      {exercises.length > 0 &&
        (() => {
          const ex = selectedExercise ?? exercises[0];
          const analytics = computeExerciseAnalytics(filtered, ex);
          if (analytics.dataPoints.length < 2) return null;
          const pts = analytics.dataPoints.map((d) => d.weight);
          const lbls = analytics.dataPoints.map((_, i) => `W${i + 1}`);
          return (
            <View
              style={[
                styles.chartCard,
                { backgroundColor: theme.colors.surface, borderColor: theme.colors.surfaceBorder },
              ]}
            >
              <Text style={[styles.chartOverline, { color: theme.colors.textSecondary }]}>
                {ex.toUpperCase()}
              </Text>
              <LineChart
                points={pts}
                labels={lbls}
                primaryColor={theme.colors.primary}
                surfaceColor={theme.colors.surface}
                hintColor={theme.colors.textHint}
                borderColor={theme.colors.surfaceBorder}
              />
            </View>
          );
        })()}

      {/* Personal Records */}
      {recentPRs.length > 0 && (
        <>
          <Text style={[styles.sectionOverline, { color: theme.colors.textHint }]}>
            PERSONAL RECORDS
          </Text>
          {recentPRs.map((pr, i) => (
            <View
              key={`${pr.exerciseName}-${pr.date}-${i}`}
              style={[
                styles.prRow,
                { backgroundColor: theme.colors.surface, borderColor: theme.colors.surfaceBorder },
              ]}
            >
              <View>
                <Text style={[styles.prName, { color: theme.colors.text }]}>{pr.exerciseName}</Text>
                <Text style={[styles.prDetail, { color: theme.colors.text }]}>
                  {pr.weight} lbs × {pr.reps ?? '—'}
                </Text>
              </View>
              <View style={styles.prRight}>
                <View style={[styles.prBadge, { backgroundColor: theme.colors.primary }]}>
                  <Text style={styles.prBadgeText}>NEW PR</Text>
                </View>
                <Text style={[styles.prDate, { color: theme.colors.textHint }]}>{pr.date}</Text>
              </View>
            </View>
          ))}
        </>
      )}

      {/* Exercise list */}
      {exercises.length > 0 && (
        <>
          <Text style={[styles.sectionOverline, { color: theme.colors.textHint, marginTop: 8 }]}>
            EXERCISES
          </Text>
          {exercises.map((name) => (
            <TouchableOpacity
              key={name}
              onPress={() => setSelectedExercise(name)}
              style={[
                styles.exerciseRow,
                { backgroundColor: theme.colors.surface, borderColor: theme.colors.surfaceBorder },
              ]}
              activeOpacity={0.7}
            >
              <Text style={[styles.exerciseName, { color: theme.colors.text }]}>{name}</Text>
              <Text style={[styles.chevron, { color: theme.colors.textHint }]}>›</Text>
            </TouchableOpacity>
          ))}
        </>
      )}

      {history.length === 0 && (
        <Text style={[styles.emptyHint, { color: theme.colors.textHint }]}>
          Complete some workouts to see your progress here.
        </Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 32 },
  screenTitle: {
    fontFamily: 'BarlowCondensed_700Bold',
    fontSize: 44,
    lineHeight: 42,
    textTransform: 'uppercase',
    paddingHorizontal: 16,
    paddingBottom: 0,
  },
  periodTabRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    marginTop: 10,
  },
  periodTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 2,
  },
  periodTabText: {
    fontFamily: 'RethinkSans_600SemiBold',
    fontSize: 13,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    marginTop: 14,
  },
  chartCard: {
    borderRadius: 12,
    padding: 12,
    paddingHorizontal: 14,
    marginBottom: 10,
    marginHorizontal: 16,
    borderWidth: 1,
  },
  chartOverline: {
    fontFamily: 'BarlowCondensed_700Bold',
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  sectionOverline: {
    fontFamily: 'RethinkSans_700Bold',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    marginBottom: 8,
    paddingHorizontal: 16,
    marginTop: 4,
  },
  prRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    paddingHorizontal: 14,
    marginBottom: 8,
    marginHorizontal: 16,
  },
  prName: {
    fontFamily: 'RethinkSans_600SemiBold',
    fontSize: 14,
  },
  prDetail: {
    fontFamily: 'BarlowCondensed_700Bold',
    fontSize: 16,
    fontVariant: ['tabular-nums'],
    marginTop: 2,
  },
  prRight: { alignItems: 'flex-end' },
  prBadge: {
    borderRadius: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  prBadgeText: {
    fontFamily: 'BarlowCondensed_700Bold',
    fontSize: 10,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: '#fff',
  },
  prDate: {
    fontFamily: 'RethinkSans_400Regular',
    fontSize: 11,
    marginTop: 3,
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    paddingHorizontal: 14,
    marginBottom: 8,
    marginHorizontal: 16,
  },
  exerciseName: {
    fontFamily: 'RethinkSans_600SemiBold',
    fontSize: 14,
  },
  chevron: {
    fontSize: 20,
    lineHeight: 22,
  },
  backBtn: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 16,
  },
  backBtnText: {
    fontFamily: 'RethinkSans_600SemiBold',
    fontSize: 13,
  },
  emptyHint: {
    textAlign: 'center',
    marginTop: 40,
    fontFamily: 'RethinkSans_400Regular',
    fontSize: 14,
    paddingHorizontal: 16,
  },
});
