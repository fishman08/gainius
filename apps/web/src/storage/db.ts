import Dexie from 'dexie';
import type { Table } from 'dexie';

interface UserRow {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
  preferences: string;
}

interface WorkoutPlanRow {
  id: string;
  userId: string;
  weekNumber: number;
  startDate: string;
  endDate: string;
  createdBy: string;
  conversationId: string;
  exercises: string;
}

interface WorkoutSessionRow {
  id: string;
  userId: string;
  planId?: string;
  date: string;
  startTime: string;
  endTime?: string;
  completed: number;
  loggedExercises: string;
  sessionType?: string;
}

interface ConversationRow {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  lastMessageAt: string;
}

interface ChatMessageRow {
  id: string;
  conversationId: string;
  role: string;
  content: string;
  timestamp: string;
  extractedExercises?: string;
}

interface SyncQueueRow {
  id: string;
  entityType: string;
  entityId: string;
  operation: string;
  payload: string;
  createdAt: string;
  retryCount: number;
}

export interface CardioLogRow {
  id: string;
  sessionId: string;
  activityType: string;
  durationSeconds: number;
  distanceMeters?: number;
  notes?: string;
}

export class FitnessTrackerDB extends Dexie {
  users!: Table<UserRow, string>;
  workoutPlans!: Table<WorkoutPlanRow, string>;
  workoutSessions!: Table<WorkoutSessionRow, string>;
  conversations!: Table<ConversationRow, string>;
  chatMessages!: Table<ChatMessageRow, string>;
  syncQueue!: Table<SyncQueueRow, string>;
  cardioLogs!: Table<CardioLogRow, string>;

  constructor() {
    super('fitness-tracker');
    this.version(1).stores({
      users: 'id',
      workoutPlans: 'id, userId, startDate',
      workoutSessions: 'id, userId, date',
      conversations: 'id, userId, lastMessageAt',
      chatMessages: 'id, conversationId, timestamp',
    });
    this.version(2).stores({
      users: 'id',
      workoutPlans: 'id, userId, startDate',
      workoutSessions: 'id, userId, date',
      conversations: 'id, userId, lastMessageAt',
      chatMessages: 'id, conversationId, timestamp',
      syncQueue: 'id, entityType, createdAt',
    });
    this.version(3).stores({
      users: 'id',
      workoutPlans: 'id, userId, startDate',
      workoutSessions: 'id, userId, date',
      conversations: 'id, userId, lastMessageAt',
      chatMessages: 'id, conversationId, timestamp',
      syncQueue: 'id, entityType, createdAt',
      cardioLogs: 'id, sessionId',
    });
  }
}

export const db = new FitnessTrackerDB();
