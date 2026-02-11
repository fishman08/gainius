import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '../store';
import { useStorage } from '../providers/StorageProvider';
import { useAuth } from '../providers/AuthProvider';
import { loadCurrentPlan, loadHistory } from '../store/slices/workoutSlice';
import EmptyPlanView from '../components/workout/EmptyPlanView';
import ActiveWorkout from '../components/workout/ActiveWorkout';
import WorkoutSummary from '../components/workout/WorkoutSummary';
import PlanOverview from '../components/workout/PlanOverview';
import PlanComparisonModal from '../components/workout/PlanComparisonModal';

export function HomeScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const storage = useStorage();
  const { user } = useAuth();
  const userId = user?.id ?? 'local-user';
  const { currentPlan, activeSession, planComparison } = useSelector(
    (state: RootState) => state.workout,
  );
  const [showSummary, setShowSummary] = useState(false);

  useEffect(() => {
    dispatch(loadCurrentPlan({ storage, userId }));
    dispatch(loadHistory({ storage, userId }));
  }, [dispatch, storage, userId]);

  const content = (() => {
    if (!currentPlan) return <EmptyPlanView />;
    if (showSummary) return <WorkoutSummary onDone={() => setShowSummary(false)} />;
    if (activeSession) return <ActiveWorkout onComplete={() => setShowSummary(true)} />;
    return <PlanOverview />;
  })();

  return (
    <>
      {content}
      {planComparison && <PlanComparisonModal />}
    </>
  );
}
