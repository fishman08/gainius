import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '../store';
import { useStorage } from '../providers/StorageProvider';
import { loadCurrentPlan, loadHistory } from '../store/slices/workoutSlice';
import { EmptyPlanView } from '../components/workout/EmptyPlanView';
import { ActiveWorkout } from '../components/workout/ActiveWorkout';
import { WorkoutSummary } from '../components/workout/WorkoutSummary';
import { PlanOverview } from '../components/workout/PlanOverview';
import { PlanComparisonView } from '../components/workout/PlanComparisonView';
import { useNotificationCheck } from '../hooks/useNotificationCheck';
import { useUserId } from '../hooks/useUserId';
import { LogCardioModal } from '../components/workout/LogCardioModal';
import { useTheme } from '../providers/ThemeProvider';

export function HomePage() {
  const dispatch = useDispatch<AppDispatch>();
  const storage = useStorage();
  const userId = useUserId();
  const { currentPlan, activeSession, planComparison } = useSelector(
    (state: RootState) => state.workout,
  );
  const [showSummary, setShowSummary] = useState(false);
  const [showCardioModal, setShowCardioModal] = useState(false);
  const { theme } = useTheme();

  useNotificationCheck();

  useEffect(() => {
    dispatch(loadCurrentPlan({ storage, userId }));
    dispatch(loadHistory({ storage, userId }));
  }, [dispatch, storage, userId]);

  const showCardioCard = !activeSession && !showSummary;

  if (!currentPlan) return <EmptyPlanView />;

  return (
    <>
      {planComparison && (
        <div style={{ maxWidth: 600, margin: '20px auto', padding: '0 16px' }}>
          <PlanComparisonView />
        </div>
      )}
      {showSummary ? (
        <WorkoutSummary onDone={() => setShowSummary(false)} />
      ) : activeSession ? (
        <ActiveWorkout onComplete={() => setShowSummary(true)} />
      ) : (
        <PlanOverview />
      )}
      {showCardioCard && (
        <div style={{ maxWidth: 600, margin: '0 auto', padding: '0 24px 24px' }}>
          <div
            onClick={() => setShowCardioModal(true)}
            style={{
              background: theme.colors.surface,
              border: `1px solid ${theme.colors.surfaceBorder}`,
              borderRadius: theme.borderRadius.md,
              padding: '14px 18px',
              cursor: 'pointer',
            }}
          >
            <div style={{ fontWeight: 600, fontSize: 14, color: theme.colors.text }}>
              Log cardio
            </div>
            <div style={{ fontSize: 13, color: theme.colors.textSecondary, marginTop: 2 }}>
              Run, swim, walk, or bike
            </div>
          </div>
        </div>
      )}
      {showCardioModal && <LogCardioModal onClose={() => setShowCardioModal(false)} />}
    </>
  );
}
