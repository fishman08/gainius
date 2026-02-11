export interface SyncConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
}

export interface SyncPreferences {
  syncWorkouts: boolean;
  syncPlans: boolean;
  syncChats: boolean;
}

export const DEFAULT_SYNC_PREFERENCES: SyncPreferences = {
  syncWorkouts: true,
  syncPlans: true,
  syncChats: true,
};

export type SyncEntityType =
  | 'user'
  | 'workout_plan'
  | 'workout_session'
  | 'conversation'
  | 'chat_message';

export type SyncOperation = 'upsert' | 'delete';

export interface SyncQueueItem {
  id: string;
  entityType: SyncEntityType;
  entityId: string;
  operation: SyncOperation;
  payload: string; // JSON-serialized
  createdAt: string;
  retryCount: number;
}

export interface SyncStatus {
  lastSyncAt: string | null;
  pendingCount: number;
  isSyncing: boolean;
  lastError: string | null;
}

export const INITIAL_SYNC_STATUS: SyncStatus = {
  lastSyncAt: null,
  pendingCount: 0,
  isSyncing: false,
  lastError: null,
};

export interface AuthTokenStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}
