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
  extractExercises,
  suggestWeightsForPlan,
} from '@fitness-tracker/shared';
import { getApiKey, getCustomPrompt } from '../../services/apiKeyStorage';

export interface ChatState {
  conversations: Conversation[];
  activeConversationId: string | null;
  isLoading: boolean;
  error: string | null;
  lastExtractedExercises: ExtractedExercise[];
}

const initialState: ChatState = {
  conversations: [],
  activeConversationId: null,
  isLoading: false,
  error: null,
  lastExtractedExercises: [],
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

    const userMessage: ChatMessage = {
      id: generateId(),
      conversationId: conversationId!,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };
    await storage.saveChatMessage(userMessage);

    const recentSessions = await storage.getWorkoutHistory(userId, 5);
    const customSystemPrompt = getCustomPrompt() ?? undefined;

    // Compute weight suggestions from workout history
    const allSessions = await storage.getWorkoutHistory(userId, 50);
    const currentPlan = await storage.getCurrentPlan(userId);
    const weightSuggestions = currentPlan
      ? suggestWeightsForPlan(allSessions, currentPlan.exercises)
      : undefined;

    const previousMessages =
      conversation.messages.length > 0 ? conversation.messages.slice(-6) : undefined;

    const systemPrompt = buildSystemPrompt({
      recentSessions,
      customSystemPrompt,
      weightSuggestions,
      previousMessages,
    });

    const recentMessages = conversation.messages.slice(-MAX_CONTEXT_MESSAGES);
    const apiMessages: ClaudeMessage[] = [
      ...recentMessages.map((m) => ({ role: m.role, content: m.content })),
      { role: 'user' as const, content: text },
    ];

    const result = await sendMessage({ apiKey, messages: apiMessages, systemPrompt });
    const extracted = extractExercises(result.text);

    const assistantMessage: ChatMessage = {
      id: generateId(),
      conversationId: conversationId!,
      role: 'assistant',
      content: result.text,
      timestamp: new Date().toISOString(),
      extractedExercises: extracted.map((e) => e.name),
    };
    await storage.saveChatMessage(assistantMessage);

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
      });
  },
});

export const {
  setActiveConversation,
  setConversations,
  clearError,
  dismissExercises,
  startNewConversation,
} = chatSlice.actions;
export default chatSlice.reducer;
