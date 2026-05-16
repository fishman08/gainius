import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { Text, ActivityIndicator, Banner, IconButton } from 'react-native-paper';
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
        dayOfWeek: ex.dayOfWeek ?? 0,
        order: i,
      }));

      const weekNumber = currentPlan ? currentPlan.weekNumber + 1 : 1;
      const plan: WorkoutPlan = {
        id: planId,
        userId,
        weekNumber,
        startDate: now.toISOString(),
        endDate: new Date(now.getTime() + 7 * 86400000).toISOString(),
        createdBy: 'ai',
        exercises: plannedExercises,
        conversationId: activeConversationId ?? '',
      };

      if (currentPlan) dispatch(setPreviousPlan(currentPlan));
      await storage.saveWorkoutPlan(plan);
      dispatch(setCurrentPlan(plan));
      if (currentPlan) dispatch(setPlanComparison(comparePlans(currentPlan, plan)));

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
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      {/* Coach header bar */}
      <View
        style={[
          styles.coachHeader,
          { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.surfaceBorder },
        ]}
      >
        <View
          style={[
            styles.coachAvatar,
            { backgroundColor: theme.colors.primary, shadowColor: theme.colors.primaryMuted },
          ]}
        >
          <Text style={styles.coachAvatarText}>AI</Text>
        </View>
        <View style={styles.coachInfo}>
          <Text style={[styles.coachName, { color: theme.colors.text }]}>AI COACH</Text>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: theme.colors.success }]} />
            <Text style={[styles.statusText, { color: theme.colors.success }]}>
              Online · Claude 4
            </Text>
          </View>
        </View>
        <IconButton
          icon="message-text-outline"
          size={20}
          iconColor={theme.colors.textHint}
          onPress={() => setShowConversations(true)}
        />
      </View>

      {error && (
        <Banner visible actions={[{ label: 'Dismiss', onPress: () => dispatch(clearError()) }]}>
          {error}
        </Banner>
      )}

      {messages.length === 0 && !isLoading ? (
        <View style={styles.empty}>
          <Text
            style={[
              styles.emptyTitle,
              { color: theme.colors.text, fontFamily: 'BarlowCondensed_600SemiBold' },
            ]}
          >
            AI Fitness Coach
          </Text>
          <Text style={[styles.emptyBody, { color: theme.colors.textSecondary }]}>
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

const styles = StyleSheet.create({
  coachHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  coachAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 2,
  },
  coachAvatarText: {
    fontFamily: 'BarlowCondensed_700Bold',
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  coachInfo: { flex: 1 },
  coachName: {
    fontFamily: 'BarlowCondensed_700Bold',
    fontSize: 22,
    lineHeight: 22,
    textTransform: 'uppercase',
    letterSpacing: -0.22,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontFamily: 'RethinkSans_600SemiBold',
    fontSize: 11,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 24,
    marginBottom: 8,
  },
  emptyBody: {
    fontFamily: 'RethinkSans_400Regular',
    fontSize: 15,
    textAlign: 'center',
  },
});
