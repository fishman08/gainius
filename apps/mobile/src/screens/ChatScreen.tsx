import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, ActivityIndicator, Banner } from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import type {
  ExtractedExercise,
  WorkoutPlan,
  PlannedExercise,
  User,
} from '@fitness-tracker/shared';
import { generateId } from '@fitness-tracker/shared';
import { useStorage } from '../providers/StorageProvider';
import { useAuth } from '../providers/AuthProvider';
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
import { useAppTheme } from '../providers/ThemeProvider';
import { Alert } from 'react-native';
import { IconButton } from 'react-native-paper';

export default function ChatScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const storage = useStorage();
  const { user } = useAuth();
  const { theme } = useAppTheme();
  const userId = user?.id ?? 'local-user';
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
    if (user) {
      storageRef.current.getUser(user.id).then(setCurrentUser);
    }
  }, [user]);

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

      Alert.alert('Plan Created', `${exercises.length} exercises added to your workout plan.`);
    },
    [dispatch, storage, activeConversationId, currentPlan, userId],
  );

  const handleDismissExercises = useCallback(() => {
    dispatch(dismissExercises());
  }, [dispatch]);

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

  if (showConversations) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8 }}>
          <IconButton icon="arrow-left" onPress={() => setShowConversations(false)} />
          <Text variant="titleMedium" style={{ flex: 1 }}>
            Conversations
          </Text>
        </View>
        <ConversationList
          conversations={conversations}
          activeConversationId={activeConversationId}
          onSelect={handleSelectConversation}
          onNewConversation={handleNewConversation}
        />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {error && (
        <Banner visible actions={[{ label: 'Dismiss', onPress: () => dispatch(clearError()) }]}>
          {error}
        </Banner>
      )}
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', paddingRight: 4 }}>
        <IconButton
          icon="message-text-outline"
          size={22}
          onPress={() => setShowConversations(true)}
        />
      </View>
      {messages.length === 0 && !isLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
          <Text variant="headlineSmall">AI Fitness Coach</Text>
          <Text
            variant="bodyMedium"
            style={{ marginTop: 8, color: theme.colors.textSecondary, textAlign: 'center' }}
          >
            Ask me about workout planning, exercises, or your fitness goals.
          </Text>
        </View>
      ) : (
        <MessageList messages={messages} />
      )}
      {isLoading && <ActivityIndicator style={{ padding: 8 }} />}
      {lastExtractedExercises.length > 0 && (
        <ExtractedExercisesCard
          exercises={lastExtractedExercises}
          onConfirm={handleConfirmExercises}
          onDismiss={handleDismissExercises}
        />
      )}
      <ChatInput onSend={handleSend} disabled={isLoading} />
    </KeyboardAvoidingView>
  );
}
