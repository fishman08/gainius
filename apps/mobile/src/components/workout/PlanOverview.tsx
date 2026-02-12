import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { Card, Text, Button, Chip } from 'react-native-paper';
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

  const themedStyles = useMemo(
    () => ({
      container: { backgroundColor: theme.colors.background },
      chip: { backgroundColor: theme.colors.background },
      chipIncrease: { backgroundColor: theme.mode === 'dark' ? '#1b3d1b' : '#E8F5E9' },
      chipDecrease: { backgroundColor: theme.mode === 'dark' ? '#3d2e00' : '#FFF3E0' },
    }),
    [theme],
  );

  useEffect(() => {
    dispatch(loadHistory({ storage, userId }));
  }, [dispatch, storage, userId]);

  if (editingSessionId) {
    return (
      <EditWorkoutSession
        sessionId={editingSessionId}
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

  return (
    <ScrollView
      style={[styles.container, themedStyles.container]}
      contentContainerStyle={styles.content}
    >
      <PlanUpdateBanner />
      <Card style={styles.planCard}>
        <Card.Title title={`Week ${currentPlan.weekNumber} Plan`} />
        <Card.Content>
          {currentPlan.exercises.map((ex) => {
            const suggestion = suggestions.find((s) => s.exerciseName === ex.exerciseName);
            return (
              <View key={ex.id} style={styles.exerciseRow}>
                <Text variant="bodyMedium" style={styles.exercise}>
                  {ex.exerciseName}: {ex.targetSets}x{ex.targetReps}
                  {ex.suggestedWeight ? ` @ ${ex.suggestedWeight} lbs` : ''}
                </Text>
                {suggestion && (
                  <Chip
                    compact
                    textStyle={styles.chipText}
                    style={[
                      themedStyles.chip,
                      suggestion.direction === 'increase' && themedStyles.chipIncrease,
                      suggestion.direction === 'decrease' && themedStyles.chipDecrease,
                    ]}
                  >
                    AI: {suggestion.suggestedWeight} lbs
                  </Chip>
                )}
              </View>
            );
          })}
        </Card.Content>
      </Card>

      <Button
        mode="contained"
        onPress={handleStart}
        style={styles.startButton}
        buttonColor={theme.colors.primary}
      >
        Start Workout
      </Button>

      <Text variant="titleMedium" style={styles.historyHeading}>
        Workout History
      </Text>

      <WorkoutHistoryList onSessionSelect={setEditingSessionId} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  planCard: { marginBottom: 16 },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  exercise: { flex: 1 },
  chipText: { fontSize: 11 },
  startButton: { marginBottom: 24 },
  historyHeading: { marginBottom: 12 },
});
