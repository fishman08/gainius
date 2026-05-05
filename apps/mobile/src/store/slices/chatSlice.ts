import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type {
  ChatMessage,
  Conversation,
  StorageService,
  ExtractedExercise,
  ClaudeMessage,
  User,
} from '@fitness-tracker/shared';
import {
  generateId,
  sendMessage,
  buildSystemPrompt,
  buildSessionReviewPrompt,
  extractExercises,
  suggestWeightsForPlan,
  searchKnowledge,
} from '@fitness-tracker/shared';
import type { WorkoutSession, WorkoutPlan } from '@fitness-tracker/shared';
import { getApiKey, getCustomPrompt } from '../../services/secureStorage';

export interface ChatState {
  conversations: Conversation[];
  activeConversationId: string | null;
  isLoading: boolean;
  error: string | null;
  lastExtractedExercises: ExtractedExercise[];
  sessionReview: string | null;
  sessionReviewLoading: boolean;
}

const initialState: ChatState = {
  conversations: [],
  activeConversationId: null,
  isLoading: false,
  error: null,
  lastExtractedExercises: [],
  sessionReview: null,
  sessionReviewLoading: false,
};

interface SendChatMessageArgs {
  text: string;
  storage: StorageService;
  userId: string;
  user: User | null;
}

const MAX_CONTEXT_MESSAGES = 10;

interface LoadConversationHistoryArgs {
  conversationId: string;
  storage: StorageService;
}

export const loadConversationHistory = createAsyncThunk(
  'chat/loadConversationHistory',
  async ({ conversationId, storage }: LoadConversationHistoryArgs) => {
    const conversation = await storage.getConversation(conversationId);
    if (!conversation) throw new Error('Conversation not found');
    return conversation;
  },
);

export const sendChatMessage = createAsyncThunk(
  'chat/sendMessage',
  async ({ text, storage, userId, user }: SendChatMessageArgs, { getState }) => {
    const apiKey = await getApiKey(user);
    if (!apiKey) throw new Error('No API key configured. Go to Settings to add one.');

    const state = (getState() as { chat: ChatState }).chat;
    let conversationId = state.activeConversationId;
    let conversation: Conversation | null = null;

    if (conversationId) {
      conversation = await storage.getConversation(conversationId);
    }

    if (!conversation) {
      conversationId = generateId();
      conversation = {
        id: conversationId,
        userId,
        title: text.slice(0, 50),
        createdAt: new Date().toISOString(),
        lastMessageAt: new Date().toISOString(),
        messages: [],
      };
    }

    // Save user message
    const userMessage: ChatMessage = {
      id: generateId(),
      conversationId: conversationId!,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };
    await storage.saveChatMessage(userMessage);

    // Build context
    const customSystemPrompt = (await getCustomPrompt()) ?? undefined;

    // Load sessions for both history context (14-day filter in contextBuilder) and weight suggestions
    const allSessions = await storage.getWorkoutHistory(userId, 50);
    const currentPlan = await storage.getCurrentPlan(userId);
    const weightSuggestions = currentPlan
      ? suggestWeightsForPlan(allSessions, currentPlan.exercises)
      : undefined;

    const previousMessages =
      conversation.messages.length > 0 ? conversation.messages.slice(-6) : undefined;

    const exerciseNames = currentPlan?.exercises.map((e) => e.exerciseName) ?? [];
    const knowledgeContext = searchKnowledge(text, {
      limit: 5,
      evidenceFilter: 'medium',
      exerciseNames,
    });

    const systemPrompt = buildSystemPrompt({
      recentSessions: allSessions,
      preferences: user?.preferences,
      customSystemPrompt,
      weightSuggestions,
      previousMessages,
      knowledgeContext,
    });

    // Build messages for API (last N messages + new one)
    const recentMessages = conversation.messages.slice(-MAX_CONTEXT_MESSAGES);
    const apiMessages: ClaudeMessage[] = [
      ...recentMessages.map((m) => ({ role: m.role, content: m.content })),
      { role: 'user' as const, content: text },
    ];

    // Call Claude
    const result = await sendMessage({
      apiKey,
      messages: apiMessages,
      systemPrompt,
    });

    // Extract exercises from response
    const extracted = extractExercises(result.text);

    // Save assistant message
    const assistantMessage: ChatMessage = {
      id: generateId(),
      conversationId: conversationId!,
      role: 'assistant',
      content: result.text,
      timestamp: new Date().toISOString(),
      extractedExercises: extracted.map((e) => e.name),
    };
    await storage.saveChatMessage(assistantMessage);

    // Update conversation
    conversation.lastMessageAt = new Date().toISOString();
    conversation.messages = [...conversation.messages, userMessage, assistantMessage];
    await storage.saveConversation(conversation);

    return {
      conversationId: conversationId!,
      conversation,
      userMessage,
      assistantMessage,
      extracted,
    };
  },
);

interface RequestSessionReviewArgs {
  session: WorkoutSession;
  plan: WorkoutPlan | null;
  user: User | null;
  weightUnit: string;
}

export const requestSessionReview = createAsyncThunk(
  'chat/requestSessionReview',
  async ({ session, plan, user, weightUnit }: RequestSessionReviewArgs) => {
    const apiKey = await getApiKey(user);
    if (!apiKey) throw new Error('No API key configured. Go to Settings to add one.');

    const systemPrompt = buildSessionReviewPrompt(session, plan, weightUnit);
    const result = await sendMessage({
      apiKey,
      messages: [{ role: 'user', content: 'Please review my workout session.' }],
      systemPrompt,
    });
    return result.text;
  },
);

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setActiveConversation(state, action: PayloadAction<string | null>) {
      state.activeConversationId = action.payload;
      state.lastExtractedExercises = [];
      state.error = null;
    },
    setConversations(state, action: PayloadAction<Conversation[]>) {
      state.conversations = action.payload.map((newConv) => {
        const existing = state.conversations.find((c) => c.id === newConv.id);
        return existing && existing.messages.length > 0
          ? { ...newConv, messages: existing.messages }
          : newConv;
      });
    },
    clearError(state) {
      state.error = null;
    },
    dismissExercises(state) {
      state.lastExtractedExercises = [];
    },
    startNewConversation(state) {
      state.activeConversationId = null;
      state.lastExtractedExercises = [];
      state.error = null;
    },
    clearSessionReview(state) {
      state.sessionReview = null;
      state.sessionReviewLoading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(sendChatMessage.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(sendChatMessage.fulfilled, (state, action) => {
        state.isLoading = false;
        state.activeConversationId = action.payload.conversationId;
        state.lastExtractedExercises = action.payload.extracted;

        const idx = state.conversations.findIndex((c) => c.id === action.payload.conversationId);
        if (idx >= 0) {
          state.conversations[idx] = action.payload.conversation;
        } else {
          state.conversations.unshift(action.payload.conversation);
        }
      })
      .addCase(sendChatMessage.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message ?? 'Failed to send message';
      })
      .addCase(loadConversationHistory.fulfilled, (state, action) => {
        state.activeConversationId = action.payload.id;
        const idx = state.conversations.findIndex((c) => c.id === action.payload.id);
        if (idx >= 0) {
          state.conversations[idx] = action.payload;
        } else {
          state.conversations.unshift(action.payload);
        }
      })
      .addCase(requestSessionReview.pending, (state) => {
        state.sessionReviewLoading = true;
        state.sessionReview = null;
      })
      .addCase(requestSessionReview.fulfilled, (state, action) => {
        state.sessionReviewLoading = false;
        state.sessionReview = action.payload;
      })
      .addCase(requestSessionReview.rejected, (state, action) => {
        state.sessionReviewLoading = false;
        state.sessionReview = `Review failed: ${action.error.message ?? 'Unknown error'}`;
      });
  },
});

export const {
  setActiveConversation,
  setConversations,
  clearError,
  dismissExercises,
  startNewConversation,
  clearSessionReview,
} = chatSlice.actions;
export default chatSlice.reducer;
