import type {
  User,
  WorkoutSession,
  WorkoutPlan,
  LoggedExercise,
  ChatMessage,
  Conversation,
} from '../types';

export interface StorageService {
  initialize(): Promise<void>;

  // User
  saveUser(user: User): Promise<void>;
  getUser(userId: string): Promise<User | null>;

  // Workout Plans
  saveWorkoutPlan(plan: WorkoutPlan): Promise<void>;
  getCurrentPlan(userId: string): Promise<WorkoutPlan | null>;

  // Workout Sessions
  saveWorkoutSession(session: WorkoutSession): Promise<void>;
  deleteWorkoutSession(sessionId: string): Promise<void>;
  getWorkoutHistory(userId: string, limit: number): Promise<WorkoutSession[]>;

  // Exercise History
  getExerciseHistory(exerciseName: string, limit: number): Promise<LoggedExercise[]>;

  // Chat
  saveChatMessage(message: ChatMessage): Promise<void>;
  getConversation(conversationId: string): Promise<Conversation | null>;
  saveConversation(conversation: Conversation): Promise<void>;
  getConversations(userId: string): Promise<Conversation[]>;

  // Data management
  clearAllData(): Promise<void>;
}
