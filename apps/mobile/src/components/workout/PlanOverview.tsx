import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, View, TouchableOpacity, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '../../store';
import { useStorage } from '../../providers/StorageProvider';
import { startWorkout, loadHistory } from '../../store/slices/workoutSlice';
import { suggestWeightsForPlan } from '@fitness-tracker/shared';
import WorkoutHistoryList from './WorkoutHistoryList';
import EditWorkoutSession from './EditWorkoutSession';
import PlanUpdateBanner from './PlanUpdateBanner';
import { useAuth } from '../../providers/AuthProvider';
import { useAppTheme } from '../../providers/ThemeProvider';

export default function PlanOverview() {
  const dispatch = useDispatch<AppDispatch>();
  const storage = useStorage();
  const { user } = useAuth();
  const { theme } = useAppTheme();
  const userId = user?.id ?? 'local-user';
  const currentPlan = useSelector((state: RootState) => state.workout.currentPlan);
  const history = useSelector((state: RootState) => state.workout.history);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);

  const suggestions = useMemo(() => {
    if (!currentPlan || history.length === 0) return [];
    return suggestWeightsForPlan(history, currentPlan.exercises);
  }, [currentPlan, history]);

  useEffect(() => {
    dispatch(loadHistory({ storage, userId }));
  }, [dispatch, storage, userId]);

  if (editingSessionId) {
    return (
      <EditWorkoutSession
        sessionId={editingSessionId}
        userId={userId}
        onDone={() => {
          setEditingSessionId(null);
          dispatch(loadHistory({ storage, userId }));
        }}
      />
    );
  }

  if (!currentPlan) return null;

  const handleStart = () => {
    dispatch(startWorkout({ storage, userId }));
  };

  const exerciseCount = currentPlan.exercises.length;
  const estimatedMin = exerciseCount * 12;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <PlanUpdateBanner />

      {/* Section overline */}
      <Text style={[styles.sectionOverline, { color: theme.colors.textHint }]}>
        TODAY'S SESSION
      </Text>

      {/* Session card */}
      <View
        style={[
          styles.sessionCard,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.surfaceBorder,
            borderLeftColor: theme.colors.primary,
          },
        ]}
      >
        {/* Upper section */}
        <View style={styles.sessionUpper}>
          <Text style={[styles.planName, { color: theme.colors.text }]}>
            {currentPlan.exercises[0]?.exerciseName
              ? inferDayLabel(currentPlan.exercises.map((e) => e.exerciseName))
              : `WEEK ${currentPlan.weekNumber} PLAN`}
          </Text>
          <Text style={[styles.planMeta, { color: theme.colors.textSecondary }]}>
            {`Day ${currentPlan.weekNumber}  ·  ${exerciseCount} exercise${exerciseCount !== 1 ? 's' : ''}  ·  ~${estimatedMin} min`}
          </Text>

          {/* Exercise chips */}
          <View style={styles.chipRow}>
            {currentPlan.exercises.slice(0, 5).map((ex) => {
              const suggestion = suggestions.find((s) => s.exerciseName === ex.exerciseName);
              const label = suggestion
                ? `${ex.exerciseName} · ${suggestion.suggestedWeight} lbs`
                : ex.exerciseName;
              return (
                <View
                  key={ex.id}
                  style={[styles.chip, { backgroundColor: theme.colors.primaryMuted }]}
                >
                  <Text style={[styles.chipText, { color: theme.colors.primary }]}>{label}</Text>
                </View>
              );
            })}
            {currentPlan.exercises.length > 5 && (
              <View style={[styles.chip, { backgroundColor: theme.colors.primaryMuted }]}>
                <Text style={[styles.chipText, { color: theme.colors.primary }]}>
                  +{currentPlan.exercises.length - 5} more
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Lower section — CTA */}
        <View style={[styles.sessionLower, { borderTopColor: theme.colors.surfaceBorder }]}>
          <TouchableOpacity
            onPress={handleStart}
            style={[styles.startButton, { backgroundColor: theme.colors.primary }]}
            activeOpacity={0.85}
          >
            <Text style={styles.startButtonText}>START WORKOUT →</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* History */}
      <Text style={[styles.historyHeading, { color: theme.colors.textSecondary }]}>HISTORY</Text>
      <WorkoutHistoryList onSessionSelect={setEditingSessionId} />
    </ScrollView>
  );
}

function inferDayLabel(names: string[]): string {
  const lower = names.map((n) => n.toLowerCase()).join(' ');
  if (lower.includes('bench') || lower.includes('chest') || lower.includes('tricep'))
    return 'UPPER BODY';
  if (lower.includes('squat') || lower.includes('leg') || lower.includes('hamstring'))
    return 'LOWER BODY';
  if (
    lower.includes('pull') ||
    lower.includes('row') ||
    lower.includes('bicep') ||
    lower.includes('back')
  )
    return 'BACK & BICEPS';
  if (lower.includes('shoulder') || lower.includes('ohp') || lower.includes('press'))
    return 'SHOULDERS';
  return "TODAY'S WORKOUT";
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 32 },
  sectionOverline: {
    fontFamily: 'RethinkSans_700Bold',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  sessionCard: {
    borderRadius: 14,
    borderLeftWidth: 4,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 14,
  },
  sessionUpper: {
    padding: 14,
    paddingBottom: 12,
  },
  planName: {
    fontFamily: 'BarlowCondensed_700Bold',
    fontSize: 28,
    lineHeight: 28,
    textTransform: 'uppercase',
  },
  planMeta: {
    fontFamily: 'RethinkSans_400Regular',
    fontSize: 12,
    marginTop: 3,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  chip: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  chipText: {
    fontFamily: 'RethinkSans_600SemiBold',
    fontSize: 11,
  },
  sessionLower: {
    borderTopWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  startButton: {
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignSelf: 'flex-start',
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  startButtonText: {
    fontFamily: 'BarlowCondensed_700Bold',
    fontSize: 16,
    letterSpacing: 0.96,
    textTransform: 'uppercase',
    color: '#fff',
  },
  historyHeading: {
    fontFamily: 'RethinkSans_700Bold',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 4,
  },
});
