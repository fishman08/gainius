import type { SupabaseClient } from '@supabase/supabase-js';
import type { StorageService } from '../storage/StorageService';
import type {
  SyncQueueItem,
  SyncEntityType,
  SyncOperation,
  SyncPreferences,
  SyncStatus,
} from './types';
import { INITIAL_SYNC_STATUS } from './types';
import {
  userToRow,
  workoutPlanToRow,
  workoutSessionToRow,
  conversationToRow,
  chatMessageToRow,
  rowToUser,
  rowToWorkoutPlan,
  rowToWorkoutSession,
  rowToConversation,
  rowToChatMessage,
} from './mappers';
import type {
  UserRow,
  WorkoutPlanRow,
  WorkoutSessionRow,
  ConversationRow,
  ChatMessageRow,
} from './mappers';

export interface SyncQueueStorage {
  getAll(): Promise<SyncQueueItem[]>;
  add(item: SyncQueueItem): Promise<void>;
  remove(id: string): Promise<void>;
  incrementRetry(id: string): Promise<void>;
  clear(): Promise<void>;
}

const TABLE_MAP: Record<SyncEntityType, string> = {
  user: 'users',
  workout_plan: 'workout_plans',
  workout_session: 'workout_sessions',
  conversation: 'conversations',
  chat_message: 'chat_messages',
};

const MAX_RETRIES = 3;

export class SyncEngine {
  private queueStorage: SyncQueueStorage;
  private preferences: SyncPreferences;
  private onEnqueue?: () => void;

  constructor(queueStorage: SyncQueueStorage, preferences: SyncPreferences) {
    this.queueStorage = queueStorage;
    this.preferences = preferences;
  }

  setOnEnqueue(cb: () => void): void {
    this.onEnqueue = cb;
  }

  updatePreferences(prefs: SyncPreferences): void {
    this.preferences = prefs;
  }

  async enqueue(
    entityType: SyncEntityType,
    entityId: string,
    operation: SyncOperation,
    payload: unknown,
  ): Promise<void> {
    if (!this.shouldSync(entityType)) return;

    const item: SyncQueueItem = {
      id: `${entityType}_${entityId}_${Date.now()}`,
      entityType,
      entityId,
      operation,
      payload: JSON.stringify(payload),
      createdAt: new Date().toISOString(),
      retryCount: 0,
    };
    await this.queueStorage.add(item);
    this.onEnqueue?.();
  }

  async pushChanges(
    client: SupabaseClient,
  ): Promise<{ pushed: number; errors: number; firstError: string | null }> {
    const queue = await this.queueStorage.getAll();

    // Sort by FK dependency: users first, then plans/sessions/conversations, then messages
    const ENTITY_PRIORITY: Record<SyncEntityType, number> = {
      user: 0,
      workout_plan: 1,
      workout_session: 1,
      conversation: 1,
      chat_message: 2,
    };
    queue.sort((a, b) => ENTITY_PRIORITY[a.entityType] - ENTITY_PRIORITY[b.entityType]);

    let pushed = 0;
    let errors = 0;
    let firstError: string | null = null;

    for (const item of queue) {
      if (item.retryCount >= MAX_RETRIES) {
        await this.queueStorage.remove(item.id);
        errors++;
        continue;
      }

      try {
        const table = TABLE_MAP[item.entityType];
        const payload = JSON.parse(item.payload);
        const row = this.toRow(item.entityType, payload);

        if (item.operation === 'upsert') {
          const { error } = await client.from(table).upsert(row);
          if (error) throw error;
        } else {
          const { error } = await client.from(table).delete().eq('id', item.entityId);
          if (error) throw error;
        }

        await this.queueStorage.remove(item.id);
        pushed++;
      } catch (err) {
        await this.queueStorage.incrementRetry(item.id);
        errors++;
        if (!firstError) {
          firstError = err instanceof Error ? err.message : String(err);
        }
      }
    }

    return { pushed, errors, firstError };
  }

  async pullChanges(
    client: SupabaseClient,
    localStorage: StorageService,
    lastSyncAt: string | null,
    userId: string,
  ): Promise<{ pulled: number }> {
    let pulled = 0;

    if (this.preferences.syncPlans) {
      pulled += await this.pullTable<WorkoutPlanRow>(
        client,
        'workout_plans',
        lastSyncAt,
        userId,
        async (row) => {
          await localStorage.saveWorkoutPlan(rowToWorkoutPlan(row));
        },
      );
    }

    if (this.preferences.syncWorkouts) {
      pulled += await this.pullTable<WorkoutSessionRow>(
        client,
        'workout_sessions',
        lastSyncAt,
        userId,
        async (row) => {
          await localStorage.saveWorkoutSession(rowToWorkoutSession(row));
        },
      );
    }

    if (this.preferences.syncChats) {
      pulled += await this.pullTable<ConversationRow>(
        client,
        'conversations',
        lastSyncAt,
        userId,
        async (row) => {
          await localStorage.saveConversation(rowToConversation(row));
        },
      );

      pulled += await this.pullChatMessages(client, lastSyncAt, userId, localStorage);
    }

    // Always sync user profile
    const { data: userData } = await client.from('users').select('*').eq('id', userId).single();
    if (userData) {
      await localStorage.saveUser(rowToUser(userData as UserRow));
      pulled++;
    }

    return { pulled };
  }

  async fullSync(
    client: SupabaseClient,
    localStorage: StorageService,
    lastSyncAt: string | null,
    userId: string,
  ): Promise<SyncStatus> {
    const status: SyncStatus = { ...INITIAL_SYNC_STATUS, isSyncing: true };

    try {
      const pushResult = await this.pushChanges(client);
      await this.pullChanges(client, localStorage, lastSyncAt, userId);

      const remaining = await this.queueStorage.getAll();
      status.lastSyncAt = new Date().toISOString();
      status.pendingCount = remaining.length;
      status.isSyncing = false;
      status.lastError = pushResult.errors > 0 ? pushResult.firstError : null;
    } catch (err) {
      status.isSyncing = false;
      status.lastError = err instanceof Error ? err.message : String(err);
      const remaining = await this.queueStorage.getAll();
      status.pendingCount = remaining.length;
    }

    return status;
  }

  async remapLocalUser(oldId: string, newId: string, localStorage: StorageService): Promise<void> {
    // Re-save user with new ID
    const user = await localStorage.getUser(oldId);
    if (user) {
      await localStorage.saveUser({ ...user, id: newId });
    }

    // Re-save plans
    const plan = await localStorage.getCurrentPlan(oldId);
    if (plan) {
      await localStorage.saveWorkoutPlan({ ...plan, userId: newId });
    }

    // Re-save sessions
    const sessions = await localStorage.getWorkoutHistory(oldId, 1000);
    for (const session of sessions) {
      await localStorage.saveWorkoutSession({ ...session, userId: newId });
    }

    // Re-save conversations and their messages
    const conversations = await localStorage.getConversations(oldId);
    for (const conv of conversations) {
      await localStorage.saveConversation({ ...conv, userId: newId });
      const fullConv = await localStorage.getConversation(conv.id);
      if (fullConv) {
        for (const msg of fullConv.messages) {
          await localStorage.saveChatMessage(msg);
        }
      }
    }
  }

  async getPendingCount(): Promise<number> {
    const queue = await this.queueStorage.getAll();
    return queue.length;
  }

  // --- Private helpers ---

  private shouldSync(entityType: SyncEntityType): boolean {
    switch (entityType) {
      case 'workout_plan':
        return this.preferences.syncPlans;
      case 'workout_session':
        return this.preferences.syncWorkouts;
      case 'conversation':
      case 'chat_message':
        return this.preferences.syncChats;
      case 'user':
        return true;
    }
  }

  private toRow(entityType: SyncEntityType, payload: unknown): unknown {
    switch (entityType) {
      case 'user':
        return userToRow(payload as Parameters<typeof userToRow>[0]);
      case 'workout_plan':
        return workoutPlanToRow(payload as Parameters<typeof workoutPlanToRow>[0]);
      case 'workout_session':
        return workoutSessionToRow(payload as Parameters<typeof workoutSessionToRow>[0]);
      case 'conversation':
        return conversationToRow(payload as Parameters<typeof conversationToRow>[0]);
      case 'chat_message':
        return chatMessageToRow(payload as Parameters<typeof chatMessageToRow>[0]);
    }
  }

  private async pullTable<T extends { updated_at: string }>(
    client: SupabaseClient,
    table: string,
    lastSyncAt: string | null,
    userId: string,
    save: (row: T) => Promise<void>,
  ): Promise<number> {
    let query = client.from(table).select('*').eq('user_id', userId);
    if (lastSyncAt) {
      query = query.gt('updated_at', lastSyncAt);
    }
    const { data, error } = await query;
    if (error || !data) return 0;

    for (const row of data as T[]) {
      await save(row);
    }
    return data.length;
  }

  private async pullChatMessages(
    client: SupabaseClient,
    lastSyncAt: string | null,
    userId: string,
    localStorage: StorageService,
  ): Promise<number> {
    // Get user's conversation IDs first
    const { data: convos } = await client.from('conversations').select('id').eq('user_id', userId);
    if (!convos || convos.length === 0) return 0;

    const convoIds = convos.map((c: { id: string }) => c.id);

    let query = client.from('chat_messages').select('*').in('conversation_id', convoIds);
    if (lastSyncAt) {
      query = query.gt('updated_at', lastSyncAt);
    }
    const { data, error } = await query;
    if (error || !data) return 0;

    for (const row of data as ChatMessageRow[]) {
      await localStorage.saveChatMessage(rowToChatMessage(row));
    }
    return data.length;
  }
}
