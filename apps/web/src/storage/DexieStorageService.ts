import type {
  StorageService,
  User,
  WorkoutSession,
  WorkoutPlan,
  LoggedExercise,
  ChatMessage,
  Conversation,
} from '@fitness-tracker/shared';
import { db } from './db';

export class DexieStorageService implements StorageService {
  async initialize(): Promise<void> {
    await db.open();
  }

  // User

  async saveUser(user: User): Promise<void> {
    await db.users.put({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
      preferences: JSON.stringify(user.preferences),
    });
  }

  async getUser(userId: string): Promise<User | null> {
    const row = await db.users.get(userId);
    if (!row) return null;
    return {
      id: row.id,
      email: row.email,
      name: row.name,
      role: (row.role as 'user' | 'admin') ?? 'user',
      createdAt: row.createdAt,
      preferences: JSON.parse(row.preferences),
    };
  }

  // Workout Plans

  async saveWorkoutPlan(plan: WorkoutPlan): Promise<void> {
    await db.workoutPlans.put({
      id: plan.id,
      userId: plan.userId,
      weekNumber: plan.weekNumber,
      startDate: plan.startDate,
      endDate: plan.endDate,
      createdBy: plan.createdBy,
      conversationId: plan.conversationId,
      exercises: JSON.stringify(plan.exercises),
    });
  }

  async getCurrentPlan(userId: string): Promise<WorkoutPlan | null> {
    const row = await db.workoutPlans
      .orderBy('startDate')
      .reverse()
      .filter((r) => r.userId === userId)
      .first();
    if (!row) return null;
    return {
      id: row.id,
      userId: row.userId,
      weekNumber: row.weekNumber,
      startDate: row.startDate,
      endDate: row.endDate,
      createdBy: row.createdBy as 'ai' | 'manual',
      conversationId: row.conversationId,
      exercises: JSON.parse(row.exercises),
    };
  }

  // Workout Sessions

  async saveWorkoutSession(session: WorkoutSession): Promise<void> {
    await db.workoutSessions.put({
      id: session.id,
      userId: session.userId,
      planId: session.planId,
      date: session.date,
      startTime: session.startTime,
      endTime: session.endTime,
      completed: session.completed ? 1 : 0,
      loggedExercises: JSON.stringify(session.loggedExercises),
    });
  }

  async deleteWorkoutSession(sessionId: string): Promise<void> {
    await db.workoutSessions.delete(sessionId);
  }

  async getWorkoutHistory(userId: string, limit: number): Promise<WorkoutSession[]> {
    const rows = await db.workoutSessions
      .orderBy('date')
      .reverse()
      .filter((r) => r.userId === userId)
      .limit(limit)
      .toArray();
    return rows.map((row) => ({
      id: row.id,
      userId: row.userId,
      planId: row.planId,
      date: row.date,
      startTime: row.startTime,
      endTime: row.endTime,
      completed: row.completed === 1,
      loggedExercises: JSON.parse(row.loggedExercises),
    }));
  }

  // Exercise History

  async getExerciseHistory(exerciseName: string, limit: number): Promise<LoggedExercise[]> {
    const rows = await db.workoutSessions.orderBy('date').reverse().toArray();
    const results: LoggedExercise[] = [];
    for (const row of rows) {
      const exercises: LoggedExercise[] = JSON.parse(row.loggedExercises);
      for (const ex of exercises) {
        if (ex.exerciseName.toLowerCase() === exerciseName.toLowerCase()) {
          results.push(ex);
          if (results.length >= limit) return results;
        }
      }
    }
    return results;
  }

  // Chat

  async saveChatMessage(message: ChatMessage): Promise<void> {
    await db.chatMessages.put({
      id: message.id,
      conversationId: message.conversationId,
      role: message.role,
      content: message.content,
      timestamp: message.timestamp,
      extractedExercises: message.extractedExercises
        ? JSON.stringify(message.extractedExercises)
        : undefined,
    });
  }

  async getConversation(conversationId: string): Promise<Conversation | null> {
    const conv = await db.conversations.get(conversationId);
    if (!conv) return null;
    const messages = await db.chatMessages
      .where('conversationId')
      .equals(conversationId)
      .sortBy('timestamp');
    return {
      id: conv.id,
      userId: conv.userId,
      title: conv.title,
      createdAt: conv.createdAt,
      lastMessageAt: conv.lastMessageAt,
      messages: messages.map((m) => ({
        id: m.id,
        conversationId: m.conversationId,
        role: m.role as 'user' | 'assistant',
        content: m.content,
        timestamp: m.timestamp,
        extractedExercises: m.extractedExercises ? JSON.parse(m.extractedExercises) : undefined,
      })),
    };
  }

  async saveConversation(conversation: Conversation): Promise<void> {
    await db.conversations.put({
      id: conversation.id,
      userId: conversation.userId,
      title: conversation.title,
      createdAt: conversation.createdAt,
      lastMessageAt: conversation.lastMessageAt,
    });
  }

  async getConversations(userId: string): Promise<Conversation[]> {
    const rows = await db.conversations
      .orderBy('lastMessageAt')
      .reverse()
      .filter((r) => r.userId === userId)
      .toArray();
    return rows.map((row) => ({
      id: row.id,
      userId: row.userId,
      title: row.title,
      createdAt: row.createdAt,
      lastMessageAt: row.lastMessageAt,
      messages: [],
    }));
  }

  async clearAllData(): Promise<void> {
    await db.chatMessages.clear();
    await db.conversations.clear();
    await db.workoutSessions.clear();
    await db.workoutPlans.clear();
    await db.users.clear();
    await db.syncQueue.clear();
  }
}
