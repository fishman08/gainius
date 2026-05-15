import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '../store';
import { useStorage } from '../providers/StorageProvider';
import { useAuth } from '../providers/AuthProvider';
import OnboardingWizard from '../components/settings/OnboardingWizard';
import { loadCurrentPlan, loadHistory } from '../store/slices/workoutSlice';
import EmptyPlanView from '../components/workout/EmptyPlanView';
import ActiveWorkout from '../components/workout/ActiveWorkout';
import WorkoutSummary from '../components/workout/WorkoutSummary';
import PlanOverview from '../components/workout/PlanOverview';
import PlanComparisonModal from '../components/workout/PlanComparisonModal';
import LogCardioModal from '../components/workout/LogCardioModal';
import { useAppTheme } from '../providers/ThemeProvider';

export function HomeScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const storage = useStorage();
  const { user, supabase } = useAuth();
  const { theme } = useAppTheme();
  const userId = user?.id ?? 'local-user';
  const { currentPlan, activeSession, planComparison } = useSelector(
    (state: RootState) => state.workout,
  );
  const [showSummary, setShowSummary] = useState(false);
  const [showCardioModal, setShowCardioModal] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [imperialOnboarding, setImperialOnboarding] = useState(false);

  useEffect(() => {
    dispatch(loadCurrentPlan({ storage, userId }));
    dispatch(loadHistory({ storage, userId }));
  }, [dispatch, storage, userId]);

  useEffect(() => {
    if (!supabase || !user?.id) return;
    supabase
      .from('profiles')
      .select('onboarding_completed_at, units_preference')
      .eq('user_id', user.id)
      .single()
      .then(({ data, error }) => {
        if (error && error.code !== 'PGRST116') return;
        if (!data || !data.onboarding_completed_at) {
          setShowOnboarding(true);
        }
        if (data?.units_preference === 'imperial') {
          setImperialOnboarding(true);
        }
      });
  }, [supabase, user?.id]);

  const content = (() => {
    if (!currentPlan) return <EmptyPlanView />;
    if (showSummary) return <WorkoutSummary onDone={() => setShowSummary(false)} />;
    if (activeSession) return <ActiveWorkout onComplete={() => setShowSummary(true)} />;
    return <PlanOverview />;
  })();

  const showCardioCard = !activeSession && !showSummary;

  return (
    <>
      {content}
      {showCardioCard && (
        <View style={styles.cardioSection}>
          <TouchableOpacity
            onPress={() => setShowCardioModal(true)}
            style={[
              styles.cardioCard,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.surfaceBorder },
            ]}
          >
            <Text variant="titleSmall" style={{ color: theme.colors.text }}>
              Log cardio
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.textSecondary }}>
              Run, swim, walk, or bike
            </Text>
          </TouchableOpacity>
        </View>
      )}
      {planComparison && <PlanComparisonModal />}
      <LogCardioModal visible={showCardioModal} onDismiss={() => setShowCardioModal(false)} />
      <OnboardingWizard
        visible={showOnboarding}
        onDismiss={() => setShowOnboarding(false)}
        supabase={supabase}
        userId={user?.id}
        imperial={imperialOnboarding}
      />
    </>
  );
}

const styles = StyleSheet.create({
  cardioSection: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  cardioCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
});
