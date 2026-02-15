import { useCallback, useEffect, useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type {
  ExtractedExercise,
  WorkoutPlan,
  PlannedExercise,
  User,
} from '@fitness-tracker/shared';
import { generateId } from '@fitness-tracker/shared';
import { useStorage } from '../providers/StorageProvider';
import type { RootState, AppDispatch } from '../store';
import {
  sendChatMessage,
  loadConversationHistory,
  setConversations,
  clearError,
  dismissExercises,
  startNewConversation,
} from '../store/slices/chatSlice';
import { setCurrentPlan, setPreviousPlan, setPlanComparison } from '../store/slices/workoutSlice';
import { comparePlans } from '@fitness-tracker/shared';
import MessageList from '../components/chat/MessageList';
import ChatInput from '../components/chat/ChatInput';
import ExtractedExercisesCard from '../components/chat/ExtractedExercisesCard';
import ConversationList from '../components/chat/ConversationList';
import { useUserId } from '../hooks/useUserId';
import { useAuth } from '../providers/AuthProvider';
import { useTheme } from '../providers/ThemeProvider';

export default function ChatPage() {
  const dispatch = useDispatch<AppDispatch>();
  const storage = useStorage();
  const userId = useUserId();
  const { user: authUser } = useAuth();
  const { theme } = useTheme();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showConversations, setShowConversations] = useState(false);
  const { conversations, activeConversationId, isLoading, error, lastExtractedExercises } =
    useSelector((state: RootState) => state.chat);
  const currentPlan = useSelector((state: RootState) => state.workout.currentPlan);

  const storageRef = useRef(storage);
  storageRef.current = storage;

  useEffect(() => {
    const s = storageRef.current;
    s.getConversations(userId).then((convos) => {
      dispatch(setConversations(convos));
      const targetId = activeConversationId ?? (convos.length > 0 ? convos[0].id : null);
      if (targetId) {
        dispatch(loadConversationHistory({ conversationId: targetId, storage: s }));
      }
    });
  }, [dispatch, userId]);

  useEffect(() => {
    if (authUser) {
      storageRef.current.getUser(authUser.id).then(setCurrentUser);
    }
  }, [authUser]);

  const activeConversation = conversations.find((c) => c.id === activeConversationId);
  const messages = activeConversation?.messages ?? [];

  const handleSend = useCallback(
    (text: string) => {
      dispatch(sendChatMessage({ text, storage, userId, user: currentUser }));
    },
    [dispatch, storage, userId, currentUser],
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

  const handleSelectConversation = useCallback(
    (conversationId: string) => {
      dispatch(loadConversationHistory({ conversationId, storage }));
      setShowConversations(false);
    },
    [dispatch, storage],
  );

  const handleNewConversation = useCallback(() => {
    dispatch(startNewConversation());
    setShowConversations(false);
  }, [dispatch]);

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

      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '4px 8px 0' }}>
        <button
          onClick={() => setShowConversations(!showConversations)}
          title="Conversations"
          style={{
            padding: '4px 10px',
            background: 'transparent',
            border: `1px solid ${theme.colors.surfaceBorder}`,
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: 13,
            color: theme.colors.textSecondary,
          }}
        >
          {showConversations ? 'Close' : 'Conversations'}
        </button>
      </div>

      {showConversations ? (
        <div style={{ flex: 1, overflow: 'hidden', paddingTop: 8 }}>
          <ConversationList
            conversations={conversations}
            activeConversationId={activeConversationId}
            onSelect={handleSelectConversation}
            onNewConversation={handleNewConversation}
          />
        </div>
      ) : (
        <>
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
        </>
      )}
    </div>
  );
}
