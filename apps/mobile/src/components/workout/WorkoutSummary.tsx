import React, { useMemo, useState, useEffect } from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { Card, Text, Button, ActivityIndicator } from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '../../store';
import { clearActiveSession } from '../../store/slices/workoutSlice';
import { requestSessionReview, clearSessionReview } from '../../store/slices/chatSlice';
import { useAppTheme } from '../../providers/ThemeProvider';
import { useAuth } from '../../providers/AuthProvider';
import { useStorage } from '../../providers/StorageProvider';
import type { User } from '@fitness-tracker/shared';

interface Props {
  onDone: () => void;
}

function formatDuration(startTime: string, endTime?: string): string {
  if (!endTime) return '--';
  const ms = new Date(endTime).getTime() - new Date(startTime).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  const remainMins = mins % 60;
  return `${hrs}h ${remainMins}m`;
}

export default function WorkoutSummary({ onDone }: Props) {
  const dispatch = useDispatch<AppDispatch>();
  const { theme } = useAppTheme();
  const session = useSelector((state: RootState) => state.workout.history[0]);
  const currentPlan = useSelector((state: RootState) => state.workout.currentPlan);
  const { sessionReview, sessionReviewLoading } = useSelector((state: RootState) => state.chat);
  const { user: authUser } = useAuth();
  const storageService = useStorage();
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    if (authUser?.id) {
      storageService.getUser(authUser.id).then(setCurrentUser);
    }
  }, [authUser, storageService]);

  useEffect(() => {
    return () => {
      dispatch(clearSessionReview());
    };
  }, [dispatch]);

  const themedStyles = useMemo(
    () => ({
      container: { backgroundColor: theme.colors.background },
      heading: { color: theme.colors.accent, fontFamily: 'BarlowCondensed_700Bold' as const },
      detail: { color: theme.colors.text },
      target: { color: theme.colors.textSecondary },
    }),
    [theme],
  );

  if (!session) return null;

  const completedExercises = session.loggedExercises.filter((ex) =>
    ex.sets.some((s) => s.completed),
  ).length;

  const totalVolume = session.loggedExercises.reduce((vol, ex) => {
    return vol + ex.sets.reduce((sv, s) => sv + (s.completed ? s.weight * s.reps : 0), 0);
  }, 0);

  const planExercises = currentPlan?.exercises ?? [];

  const handleDone = () => {
    dispatch(clearActiveSession());
    onDone();
  };

  return (
    <ScrollView
      style={[styles.container, themedStyles.container]}
      contentContainerStyle={styles.content}
    >
      <Text variant="headlineSmall" style={[styles.heading, themedStyles.heading]}>
        Workout Complete
      </Text>

      <Card style={styles.summaryCard}>
        <Card.Content>
          <View style={styles.statRow}>
            <Text variant="bodyMedium">Date</Text>
            <Text variant="bodyMedium">{session.date}</Text>
          </View>
          <View style={styles.statRow}>
            <Text variant="bodyMedium">Duration</Text>
            <Text variant="bodyMedium">{formatDuration(session.startTime, session.endTime)}</Text>
          </View>
          <View style={styles.statRow}>
            <Text variant="bodyMedium">Exercises</Text>
            <Text variant="bodyMedium">
              {completedExercises} / {session.loggedExercises.length}
            </Text>
          </View>
          <View style={styles.statRow}>
            <Text variant="bodyMedium">Total Volume</Text>
            <Text variant="bodyMedium">{totalVolume.toLocaleString()} lbs</Text>
          </View>
        </Card.Content>
      </Card>

      <Text variant="titleMedium" style={styles.detailHeading}>
        Exercise Details
      </Text>

      {session.loggedExercises.map((ex) => {
        const planned = planExercises.find((pe) => pe.id === ex.plannedExerciseId);
        const completedSets = ex.sets.filter((s) => s.completed).length;
        return (
          <Card key={ex.id} style={styles.exerciseCard}>
            <Card.Content>
              <Text variant="titleSmall">{ex.exerciseName}</Text>
              <Text variant="bodySmall" style={[styles.detail, themedStyles.detail]}>
                Completed: {completedSets} / {ex.sets.length} sets
              </Text>
              {planned && (
                <Text variant="bodySmall" style={[styles.target, themedStyles.target]}>
                  Target: {planned.targetSets}x{planned.targetReps}
                  {planned.suggestedWeight ? ` @ ${planned.suggestedWeight} lbs` : ''}
                </Text>
              )}
            </Card.Content>
          </Card>
        );
      })}

      <Button
        mode="outlined"
        onPress={() =>
          dispatch(
            requestSessionReview({
              session,
              plan: currentPlan,
              user: currentUser,
              weightUnit: currentUser?.preferences?.weightUnit ?? 'lbs',
            }),
          )
        }
        disabled={sessionReviewLoading || !!sessionReview}
        loading={sessionReviewLoading}
        style={styles.reviewButton}
      >
        {sessionReview ? 'AI Review' : 'Get AI Review'}
      </Button>

      {sessionReview && (
        <Card style={styles.reviewCard}>
          <Card.Content>
            <Text variant="bodyMedium">{sessionReview}</Text>
          </Card.Content>
        </Card>
      )}

      <Button mode="contained" onPress={handleDone} style={styles.doneButton}>
        Done
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  heading: { textAlign: 'center', marginBottom: 16 },
  summaryCard: { marginBottom: 16 },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  detailHeading: { marginBottom: 8, marginTop: 8 },
  exerciseCard: { marginBottom: 8 },
  detail: { marginTop: 2 },
  target: { marginTop: 2 },
  reviewButton: { marginTop: 12 },
  reviewCard: { marginTop: 12 },
  doneButton: { marginTop: 16 },
});
