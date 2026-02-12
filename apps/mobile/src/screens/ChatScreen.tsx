import React, { useCallback, useEffect } from 'react';
import { View, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, ActivityIndicator, Banner } from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import type { ExtractedExercise, WorkoutPlan, PlannedExercise } from '@fitness-tracker/shared';
import { generateId } from '@fitness-tracker/shared';
import { useStorage } from '../providers/StorageProvider';
import { useAuth } from '../providers/AuthProvider';
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
import { useAppTheme } from '../providers/ThemeProvider';
import { Alert } from 'react-native';

export default function ChatScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const storage = useStorage();
  const { user } = useAuth();
  const { theme } = useAppTheme();
  const userId = user?.id ?? 'local-user';
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
      dispatch(sendChatMessage({ text, storage, userId }));
    },
    [dispatch, storage, userId],
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
