import React, { useEffect, useState } from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
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
import StreakCard from '../components/progress/StreakCard';
import { useAppTheme } from '../providers/ThemeProvider';

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

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
  const [displayName, setDisplayName] = useState('');

  useEffect(() => {
    dispatch(loadCurrentPlan({ storage, userId }));
    dispatch(loadHistory({ storage, userId }));
  }, [dispatch, storage, userId]);

  useEffect(() => {
    if (!supabase || !user?.id) return;
    supabase
      .from('profiles')
      .select('onboarding_completed_at, units_preference, full_name')
      .eq('user_id', user.id)
      .single()
      .then(({ data, error }) => {
        if (error && error.code !== 'PGRST116') return;
        if (!data || !data.onboarding_completed_at) setShowOnboarding(true);
        if (data?.units_preference === 'imperial') setImperialOnboarding(true);
        if (data?.full_name) setDisplayName(data.full_name);
      });
  }, [supabase, user?.id]);

  if (showSummary) {
    return <WorkoutSummary onDone={() => setShowSummary(false)} />;
  }

  if (activeSession) {
    return <ActiveWorkout onComplete={() => setShowSummary(true)} />;
  }

  const showCardioCard = !activeSession && !showSummary;

  return (
    <>
      <ScrollView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Greeting header */}
        <View style={styles.header}>
          <Text style={[styles.greetingSmall, { color: theme.colors.textSecondary }]}>
            {greeting()}
          </Text>
          {displayName ? (
            <Text style={[styles.greetingName, { color: theme.colors.text }]}>
              {displayName.toUpperCase()}
            </Text>
          ) : null}
        </View>

        {/* Streak card */}
        <StreakCard />

        {/* Plan overview (today's session card) */}
        {currentPlan ? <PlanOverview /> : <EmptyPlanView />}

        {/* Quick Add — Log Cardio */}
        {showCardioCard && (
          <>
            <Text style={[styles.sectionOverline, { color: theme.colors.textHint }]}>
              QUICK ADD
            </Text>
            <TouchableOpacity
              onPress={() => setShowCardioModal(true)}
              style={[
                styles.cardioCard,
                { backgroundColor: theme.colors.surface, borderColor: theme.colors.surfaceBorder },
              ]}
              activeOpacity={0.7}
            >
              <View>
                <Text style={[styles.cardioTitle, { color: theme.colors.text }]}>Log Cardio</Text>
                <Text style={[styles.cardioSub, { color: theme.colors.textSecondary }]}>
                  Run, swim, walk, or bike
                </Text>
              </View>
              <View
                style={[
                  styles.plusCircle,
                  {
                    backgroundColor: theme.colors.primaryMuted,
                    borderColor: 'rgba(249,115,22,0.25)',
                  },
                ]}
              >
                <Text style={[styles.plusIcon, { color: theme.colors.primary }]}>+</Text>
              </View>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

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
  container: { flex: 1 },
  content: { paddingBottom: 32 },
  header: {
    paddingTop: 20,
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  greetingSmall: {
    fontFamily: 'RethinkSans_600SemiBold',
    fontSize: 12,
    letterSpacing: 0.24,
    marginBottom: 2,
  },
  greetingName: {
    fontFamily: 'BarlowCondensed_700Bold',
    fontSize: 34,
    lineHeight: 34,
    textTransform: 'uppercase',
    letterSpacing: -0.34,
  },
  sectionOverline: {
    fontFamily: 'RethinkSans_700Bold',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginHorizontal: 16,
  },
  cardioCard: {
    marginHorizontal: 16,
    borderRadius: 14,
    padding: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
  },
  cardioTitle: {
    fontFamily: 'RethinkSans_600SemiBold',
    fontSize: 15,
  },
  cardioSub: {
    fontFamily: 'RethinkSans_400Regular',
    fontSize: 12,
    marginTop: 1,
  },
  plusCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusIcon: {
    fontSize: 22,
    lineHeight: 24,
    fontWeight: '300',
  },
});
