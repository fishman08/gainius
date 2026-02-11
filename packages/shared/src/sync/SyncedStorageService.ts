import type { StorageService } from '../storage/StorageService';
import type {
  User,
  WorkoutSession,
  WorkoutPlan,
  LoggedExercise,
  ChatMessage,
  Conversation,
} from '../types';
import type { SyncEngine } from './syncEngine';

export class SyncedStorageService implements StorageService {
  private local: StorageService;
  private syncEngine: SyncEngine;

  constructor(local: StorageService, syncEngine: SyncEngine) {
    this.local = local;
    this.syncEngine = syncEngine;
  }

  async initialize(): Promise<void> {
    await this.local.initialize();
  }

  // User — always sync
  async saveUser(user: User): Promise<void> {
    await this.local.saveUser(user);
    await this.syncEngine.enqueue('user', user.id, 'upsert', user);
  }

  async getUser(userId: string): Promise<User | null> {
    return this.local.getUser(userId);
  }

  // Workout Plans
  async saveWorkoutPlan(plan: WorkoutPlan): Promise<void> {
    await this.local.saveWorkoutPlan(plan);
    await this.syncEngine.enqueue('workout_plan', plan.id, 'upsert', plan);
  }

  async getCurrentPlan(userId: string): Promise<WorkoutPlan | null> {
    return this.local.getCurrentPlan(userId);
  }

  // Workout Sessions
  async saveWorkoutSession(session: WorkoutSession): Promise<void> {
    await this.local.saveWorkoutSession(session);
    await this.syncEngine.enqueue('workout_session', session.id, 'upsert', session);
  }

  async deleteWorkoutSession(sessionId: string): Promise<void> {
    await this.local.deleteWorkoutSession(sessionId);
    await this.syncEngine.enqueue('workout_session', sessionId, 'delete', {});
  }

  async getWorkoutHistory(userId: string, limit: number): Promise<WorkoutSession[]> {
    return this.local.getWorkoutHistory(userId, limit);
  }

  // Exercise History — read-only, no sync needed
  async getExerciseHistory(exerciseName: string, limit: number): Promise<LoggedExercise[]> {
    return this.local.getExerciseHistory(exerciseName, limit);
  }

  // Chat
  async saveChatMessage(message: ChatMessage): Promise<void> {
    await this.local.saveChatMessage(message);
    await this.syncEngine.enqueue('chat_message', message.id, 'upsert', message);
  }

  async getConversation(conversationId: string): Promise<Conversation | null> {
    return this.local.getConversation(conversationId);
  }

  async saveConversation(conversation: Conversation): Promise<void> {
    await this.local.saveConversation(conversation);
    await this.syncEngine.enqueue('conversation', conversation.id, 'upsert', conversation);
  }

  async getConversations(userId: string): Promise<Conversation[]> {
    return this.local.getConversations(userId);
  }

  async clearAllData(): Promise<void> {
    return this.local.clearAllData();
  }
}
