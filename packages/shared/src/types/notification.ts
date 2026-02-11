export type NotificationType =
  | 'plan_update_reminder'
  | 'workout_day_reminder'
  | 'rest_day'
  | 'achievement';

export interface NotificationPreferences {
  enabled: boolean;
  workoutReminders: boolean;
  planUpdateReminders: boolean;
  restDayNotifications: boolean;
  achievementCelebrations: boolean;
  reminderTime: string; // HH:mm
  quietHoursStart: string | null; // HH:mm
  quietHoursEnd: string | null; // HH:mm
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  enabled: true,
  workoutReminders: true,
  planUpdateReminders: true,
  restDayNotifications: false,
  achievementCelebrations: true,
  reminderTime: '09:00',
  quietHoursStart: null,
  quietHoursEnd: null,
};

export interface ScheduledNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  scheduledFor: string; // ISO date
  dayOfWeek?: number; // 0=Sun..6=Sat
  recurring: boolean;
}

export interface PlanComparisonSummary {
  weekNumber: number;
  startDate: string;
  endDate: string;
  exerciseCount: number;
  totalSets: number;
}

export interface PlanChange {
  exerciseName: string;
  changeType: 'added' | 'removed' | 'modified' | 'unchanged';
  oldValue?: string;
  newValue?: string;
  details?: string;
}

export interface PlanComparison {
  oldPlan: PlanComparisonSummary;
  newPlan: PlanComparisonSummary;
  changes: PlanChange[];
  claudeReasoning?: string;
}
