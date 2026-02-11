import type { WorkoutPlan } from '../types';

function todayDateStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function daysBetween(dateStrA: string, dateStrB: string): number {
  const a = new Date(dateStrA + 'T00:00:00');
  const b = new Date(dateStrB + 'T00:00:00');
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

export function isPlanExpired(plan: WorkoutPlan): boolean {
  const today = todayDateStr();
  return today > plan.endDate.split('T')[0];
}

export function isPlanExpiringSoon(plan: WorkoutPlan, daysThreshold = 1): boolean {
  const today = todayDateStr();
  const endDate = plan.endDate.split('T')[0];
  const remaining = daysBetween(today, endDate);
  return remaining >= 0 && remaining <= daysThreshold;
}

export function getDaysRemainingInPlan(plan: WorkoutPlan): number {
  const today = todayDateStr();
  const endDate = plan.endDate.split('T')[0];
  const remaining = daysBetween(today, endDate);
  return Math.max(0, remaining);
}

export function getWorkoutDaysFromPlan(plan: WorkoutPlan): number[] {
  const days = new Set<number>();
  for (const ex of plan.exercises) {
    days.add(ex.dayOfWeek);
  }
  return Array.from(days).sort((a, b) => a - b);
}

export function isWorkoutDay(plan: WorkoutPlan): boolean {
  const today = new Date().getDay();
  return getWorkoutDaysFromPlan(plan).includes(today);
}

export function isRestDay(plan: WorkoutPlan): boolean {
  return !isWorkoutDay(plan);
}
