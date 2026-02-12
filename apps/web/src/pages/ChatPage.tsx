import { useCallback, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { ExtractedExercise, WorkoutPlan, PlannedExercise } from '@fitness-tracker/shared';
import { generateId } from '@fitness-tracker/shared';
import { useStorage } from '../providers/StorageProvider';
import type { RootState, AppDispatch } from '../store';
import {
  sendChatMessage,
  setConversations,
  clearError,
  dismissExercises,
} from '../store/slices/chatSlice';
import { setCurrentPlan, setPreviousPlan, setPlanComparison } from '../store/slices/workoutSlice';
import { comparePlans } from '@fitness-tracker/shared';
import MessageList from '../components/chat/MessageList';
import ChatInput from '../components/chat/ChatInput';
import ExtractedExercisesCard from '../components/chat/ExtractedExercisesCard';
import { useUserId } from '../hooks/useUserId';
import { useTheme } from '../providers/ThemeProvider';

export default function ChatPage() {
  const dispatch = useDispatch<AppDispatch>();
  const storage = useStorage();
  const userId = useUserId();
  const { theme } = useTheme();
  const { conversations, activeConversationId, isLoading, error, lastExtractedExercises } =
    useSelector((state: RootState) => state.chat);
  const currentPlan = useSelector((state: RootState) => state.workout.currentPlan);

  useEffect(() => {
    storage.getConversations(userId).then((convos) => {
      dispatch(setConversations(convos));
    });
  }, [dispatch, storage, userId]);

  const activeConversation = conversations.find((c) => c.id === activeConversationId);
  const messages = activeConversation?.messages ?? [];

  const handleSend = useCallback(
    (text: string) => {
      dispatch(sendChatMessage({ text, storage, userId: userId }));
    },
    [dispatch, storage],
  );

  const handleConfirmExercises = useCallback(
    async (exercises: ExtractedExercise[]) => {
      const planId = generateId();
      const now = new Date();
      const plannedExercises: PlannedExercise[] = exercises.map((ex, i) => ({
        id: generateId(),
        planId,
        exerciseName: ex.name,
        targetSets: ex.sets,
        targetReps: ex.reps,
        suggestedWeight: ex.weight,
        dayOfWeek: 0,
        order: i,
      }));

      const weekNumber = currentPlan ? currentPlan.weekNumber + 1 : 1;
      const plan: WorkoutPlan = {
        id: planId,
        userId: userId,
        weekNumber,
        startDate: now.toISOString(),
        endDate: new Date(now.getTime() + 7 * 86400000).toISOString(),
        createdBy: 'ai',
        exercises: plannedExercises,
        conversationId: activeConversationId ?? '',
      };

      if (currentPlan) {
        dispatch(setPreviousPlan(currentPlan));
      }

      await storage.saveWorkoutPlan(plan);
      dispatch(setCurrentPlan(plan));

      if (currentPlan) {
        dispatch(setPlanComparison(comparePlans(currentPlan, plan)));
      }

      alert(`Plan created with ${exercises.length} exercises!`);
    },
    [dispatch, storage, activeConversationId, currentPlan],
  );

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 48px)',
        backgroundColor: theme.colors.background,
      }}
    >
      {error && (
        <div
          style={{
            padding: '8px 16px',
            backgroundColor: theme.mode === 'dark' ? '#4a1c1c' : '#f8d7da',
            color: theme.colors.error,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>{error}</span>
          <button
            onClick={() => dispatch(clearError())}
            style={{ border: 'none', background: 'none', cursor: 'pointer', fontWeight: 600 }}
          >
            Dismiss
          </button>
        </div>
      )}

      {messages.length === 0 && !isLoading ? (
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <h2 style={{ color: theme.colors.primary }}>AI Fitness Coach</h2>
          <p style={{ color: theme.colors.textSecondary }}>
            Ask me about workout planning, exercises, or your fitness goals.
          </p>
        </div>
      ) : (
        <MessageList messages={messages} />
      )}

      {isLoading && (
        <div style={{ textAlign: 'center', padding: 8, color: theme.colors.textSecondary }}>
          Thinking...
        </div>
      )}

      {lastExtractedExercises.length > 0 && (
        <ExtractedExercisesCard
          exercises={lastExtractedExercises}
          onConfirm={handleConfirmExercises}
          onDismiss={() => dispatch(dismissExercises())}
        />
      )}

      <ChatInput onSend={handleSend} disabled={isLoading} />
    </div>
  );
}
