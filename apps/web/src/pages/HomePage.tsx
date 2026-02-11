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

export function HomePage() {
  const dispatch = useDispatch<AppDispatch>();
  const storage = useStorage();
  const userId = useUserId();
  const { currentPlan, activeSession, planComparison } = useSelector(
    (state: RootState) => state.workout,
  );
  const [showSummary, setShowSummary] = useState(false);

  useNotificationCheck();

  useEffect(() => {
    dispatch(loadCurrentPlan({ storage, userId }));
    dispatch(loadHistory({ storage, userId }));
  }, [dispatch, storage, userId]);

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
    </>
  );
}
