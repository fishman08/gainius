import * as SQLite from 'expo-sqlite';
import type {
  StorageService,
  User,
  WorkoutSession,
  WorkoutPlan,
  LoggedExercise,
  ChatMessage,
  Conversation,
} from '@fitness-tracker/shared';
import { runMigrations } from './migrations';

export class SqliteStorageService implements StorageService {
  private db: SQLite.SQLiteDatabase;

  constructor() {
    this.db = SQLite.openDatabaseSync('fitness-tracker.db');
  }

  async initialize(): Promise<void> {
    await runMigrations(this.db);
  }

  // User

  async saveUser(user: User): Promise<void> {
    await this.db.runAsync(
      'INSERT OR REPLACE INTO users (id, email, name, created_at, preferences) VALUES (?, ?, ?, ?, ?)',
      [user.id, user.email, user.name, user.createdAt, JSON.stringify(user.preferences)],
    );
  }

  async getUser(userId: string): Promise<User | null> {
    const row = await this.db.getFirstAsync<Record<string, string>>(
      'SELECT * FROM users WHERE id = ?',
      [userId],
    );
    if (!row) return null;
    return {
      id: row.id,
      email: row.email,
      name: row.name,
      createdAt: row.created_at,
      preferences: JSON.parse(row.preferences),
    };
  }

  // Workout Plans

  async saveWorkoutPlan(plan: WorkoutPlan): Promise<void> {
    await this.db.runAsync(
      'INSERT OR REPLACE INTO workout_plans (id, user_id, week_number, start_date, end_date, created_by, conversation_id, exercises) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [
        plan.id,
        plan.userId,
        plan.weekNumber,
        plan.startDate,
        plan.endDate,
        plan.createdBy,
        plan.conversationId,
        JSON.stringify(plan.exercises),
      ],
    );
  }

  async getCurrentPlan(userId: string): Promise<WorkoutPlan | null> {
    const row = await this.db.getFirstAsync<Record<string, string | number>>(
      'SELECT * FROM workout_plans WHERE user_id = ? ORDER BY start_date DESC LIMIT 1',
      [userId],
    );
    if (!row) return null;
    return {
      id: row.id as string,
      userId: row.user_id as string,
      weekNumber: row.week_number as number,
      startDate: row.start_date as string,
      endDate: row.end_date as string,
      createdBy: row.created_by as 'ai' | 'manual',
      conversationId: row.conversation_id as string,
      exercises: JSON.parse(row.exercises as string),
    };
  }

  // Workout Sessions

  async saveWorkoutSession(session: WorkoutSession): Promise<void> {
    await this.db.runAsync(
      'INSERT OR REPLACE INTO workout_sessions (id, user_id, plan_id, date, start_time, end_time, completed, logged_exercises) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [
        session.id,
        session.userId,
        session.planId ?? null,
        session.date,
        session.startTime,
        session.endTime ?? null,
        session.completed ? 1 : 0,
        JSON.stringify(session.loggedExercises),
      ],
    );
  }

  async deleteWorkoutSession(sessionId: string): Promise<void> {
    await this.db.runAsync('DELETE FROM workout_sessions WHERE id = ?', [sessionId]);
  }

  async getWorkoutHistory(userId: string, limit: number): Promise<WorkoutSession[]> {
    const rows = await this.db.getAllAsync<Record<string, string | number>>(
      'SELECT * FROM workout_sessions WHERE user_id = ? ORDER BY date DESC LIMIT ?',
      [userId, limit],
    );
    return rows.map((row) => ({
      id: row.id as string,
      userId: row.user_id as string,
      planId: row.plan_id as string | undefined,
      date: row.date as string,
      startTime: row.start_time as string,
      endTime: row.end_time as string | undefined,
      completed: row.completed === 1,
      loggedExercises: JSON.parse(row.logged_exercises as string),
    }));
  }

  // Exercise History

  async getExerciseHistory(exerciseName: string, limit: number): Promise<LoggedExercise[]> {
    const rows = await this.db.getAllAsync<Record<string, string>>(
      'SELECT logged_exercises FROM workout_sessions ORDER BY date DESC',
    );
    const results: LoggedExercise[] = [];
    for (const row of rows) {
      const exercises: LoggedExercise[] = JSON.parse(row.logged_exercises);
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
    await this.db.runAsync(
      'INSERT OR REPLACE INTO chat_messages (id, conversation_id, role, content, timestamp, extracted_exercises) VALUES (?, ?, ?, ?, ?, ?)',
      [
        message.id,
        message.conversationId,
        message.role,
        message.content,
        message.timestamp,
        message.extractedExercises ? JSON.stringify(message.extractedExercises) : null,
      ],
    );
  }

  async getConversation(conversationId: string): Promise<Conversation | null> {
    const conv = await this.db.getFirstAsync<Record<string, string>>(
      'SELECT * FROM conversations WHERE id = ?',
      [conversationId],
    );
    if (!conv) return null;

    const messages = await this.db.getAllAsync<Record<string, string>>(
      'SELECT * FROM chat_messages WHERE conversation_id = ? ORDER BY timestamp ASC',
      [conversationId],
    );

    return {
      id: conv.id,
      userId: conv.user_id,
      title: conv.title,
      createdAt: conv.created_at,
      lastMessageAt: conv.last_message_at,
      messages: messages.map((m) => ({
        id: m.id,
        conversationId: m.conversation_id,
        role: m.role as 'user' | 'assistant',
        content: m.content,
        timestamp: m.timestamp,
        extractedExercises: m.extracted_exercises ? JSON.parse(m.extracted_exercises) : undefined,
      })),
    };
  }

  async saveConversation(conversation: Conversation): Promise<void> {
    await this.db.runAsync(
      'INSERT OR REPLACE INTO conversations (id, user_id, title, created_at, last_message_at) VALUES (?, ?, ?, ?, ?)',
      [
        conversation.id,
        conversation.userId,
        conversation.title,
        conversation.createdAt,
        conversation.lastMessageAt,
      ],
    );
  }

  async getConversations(userId: string): Promise<Conversation[]> {
    const rows = await this.db.getAllAsync<Record<string, string>>(
      'SELECT * FROM conversations WHERE user_id = ? ORDER BY last_message_at DESC',
      [userId],
    );
    return rows.map((row) => ({
      id: row.id,
      userId: row.user_id,
      title: row.title,
      createdAt: row.created_at,
      lastMessageAt: row.last_message_at,
      messages: [],
    }));
  }

  async clearAllData(): Promise<void> {
    await this.db.runAsync('DELETE FROM chat_messages');
    await this.db.runAsync('DELETE FROM conversations');
    await this.db.runAsync('DELETE FROM workout_sessions');
    await this.db.runAsync('DELETE FROM workout_plans');
    await this.db.runAsync('DELETE FROM users');
    await this.db.runAsync('DELETE FROM sync_queue');
  }
}
