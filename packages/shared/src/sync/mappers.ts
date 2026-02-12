import type { User, WorkoutPlan, WorkoutSession, Conversation, ChatMessage } from '../types';

// --- Supabase row types ---

export interface UserRow {
  id: string;
  email: string;
  name: string;
  role: string;
  preferences: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface WorkoutPlanRow {
  id: string;
  user_id: string;
  week_number: number;
  start_date: string;
  end_date: string;
  created_by: string;
  conversation_id: string;
  exercises: unknown[];
  updated_at: string;
}

export interface WorkoutSessionRow {
  id: string;
  user_id: string;
  plan_id: string | null;
  date: string;
  start_time: string;
  end_time: string | null;
  completed: boolean;
  logged_exercises: unknown[];
  updated_at: string;
}

export interface ConversationRow {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  last_message_at: string;
  updated_at: string;
}

export interface ChatMessageRow {
  id: string;
  conversation_id: string;
  role: string;
  content: string;
  extracted_exercises: string[] | null;
  timestamp: string;
  updated_at: string;
}

// --- To Supabase Row ---

export function userToRow(user: User): Omit<UserRow, 'updated_at'> {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    preferences: user.preferences as unknown as Record<string, unknown>,
    created_at: user.createdAt,
  };
}

export function workoutPlanToRow(plan: WorkoutPlan): Omit<WorkoutPlanRow, 'updated_at'> {
  return {
    id: plan.id,
    user_id: plan.userId,
    week_number: plan.weekNumber,
    start_date: plan.startDate,
    end_date: plan.endDate,
    created_by: plan.createdBy,
    conversation_id: plan.conversationId,
    exercises: plan.exercises as unknown as unknown[],
  };
}

export function workoutSessionToRow(
  session: WorkoutSession,
): Omit<WorkoutSessionRow, 'updated_at'> {
  return {
    id: session.id,
    user_id: session.userId,
    plan_id: session.planId ?? null,
    date: session.date,
    start_time: session.startTime,
    end_time: session.endTime ?? null,
    completed: session.completed,
    logged_exercises: session.loggedExercises as unknown as unknown[],
  };
}

export function conversationToRow(conv: Conversation): Omit<ConversationRow, 'updated_at'> {
  return {
    id: conv.id,
    user_id: conv.userId,
    title: conv.title,
    created_at: conv.createdAt,
    last_message_at: conv.lastMessageAt,
  };
}

export function chatMessageToRow(msg: ChatMessage): Omit<ChatMessageRow, 'updated_at'> {
  return {
    id: msg.id,
    conversation_id: msg.conversationId,
    role: msg.role,
    content: msg.content,
    extracted_exercises: msg.extractedExercises ?? null,
    timestamp: msg.timestamp,
  };
}

// --- From Supabase Row ---

export function rowToUser(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    role: (row.role as 'user' | 'admin') ?? 'user',
    name: row.name,
    createdAt: row.created_at,
    preferences: row.preferences as unknown as User['preferences'],
  };
}

export function rowToWorkoutPlan(row: WorkoutPlanRow): WorkoutPlan {
  return {
    id: row.id,
    userId: row.user_id,
    weekNumber: row.week_number,
    startDate: row.start_date,
    endDate: row.end_date,
    createdBy: row.created_by as 'ai' | 'manual',
    conversationId: row.conversation_id,
    exercises: row.exercises as unknown as WorkoutPlan['exercises'],
  };
}

export function rowToWorkoutSession(row: WorkoutSessionRow): WorkoutSession {
  return {
    id: row.id,
    userId: row.user_id,
    planId: row.plan_id ?? undefined,
    date: row.date,
    startTime: row.start_time,
    endTime: row.end_time ?? undefined,
    completed: row.completed,
    loggedExercises: row.logged_exercises as unknown as WorkoutSession['loggedExercises'],
  };
}

export function rowToConversation(row: ConversationRow): Conversation {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    createdAt: row.created_at,
    lastMessageAt: row.last_message_at,
    messages: [],
  };
}

export function rowToChatMessage(row: ChatMessageRow): ChatMessage {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    role: row.role as 'user' | 'assistant',
    content: row.content,
    timestamp: row.timestamp,
    extractedExercises: row.extracted_exercises ?? undefined,
  };
}
