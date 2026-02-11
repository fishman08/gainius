import type { StorageService } from '../storage/StorageService';
import type { User, WorkoutPlan, WorkoutSession, Conversation } from '../types';

export interface ExportedData {
  version: 1;
  exportedAt: string;
  user: User | null;
  currentPlan: WorkoutPlan | null;
  workoutHistory: WorkoutSession[];
  conversations: Conversation[];
}

export async function exportAllData(
  storage: StorageService,
  userId: string,
): Promise<ExportedData> {
  const [user, currentPlan, workoutHistory, conversations] = await Promise.all([
    storage.getUser(userId),
    storage.getCurrentPlan(userId),
    storage.getWorkoutHistory(userId, 10000),
    storage.getConversations(userId),
  ]);

  // Load full conversation data with messages
  const fullConversations: Conversation[] = [];
  for (const conv of conversations) {
    const full = await storage.getConversation(conv.id);
    if (full) fullConversations.push(full);
  }

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    user,
    currentPlan,
    workoutHistory,
    conversations: fullConversations,
  };
}

export interface ImportResult {
  imported: {
    users: number;
    plans: number;
    sessions: number;
    conversations: number;
    messages: number;
  };
  errors: string[];
}

export async function importData(
  storage: StorageService,
  data: ExportedData,
  userId: string,
): Promise<ImportResult> {
  const result: ImportResult = {
    imported: { users: 0, plans: 0, sessions: 0, conversations: 0, messages: 0 },
    errors: [],
  };

  try {
    if (data.user) {
      await storage.saveUser({ ...data.user, id: userId });
      result.imported.users++;
    }
  } catch (e) {
    result.errors.push(`User: ${e instanceof Error ? e.message : String(e)}`);
  }

  try {
    if (data.currentPlan) {
      await storage.saveWorkoutPlan({ ...data.currentPlan, userId });
      result.imported.plans++;
    }
  } catch (e) {
    result.errors.push(`Plan: ${e instanceof Error ? e.message : String(e)}`);
  }

  for (const session of data.workoutHistory) {
    try {
      await storage.saveWorkoutSession({ ...session, userId });
      result.imported.sessions++;
    } catch (e) {
      result.errors.push(`Session ${session.id}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  for (const conv of data.conversations) {
    try {
      await storage.saveConversation({ ...conv, userId });
      result.imported.conversations++;
      for (const msg of conv.messages) {
        await storage.saveChatMessage(msg);
        result.imported.messages++;
      }
    } catch (e) {
      result.errors.push(`Conversation ${conv.id}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return result;
}
