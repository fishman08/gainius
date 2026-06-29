export interface WorkoutPlan {
  id: string;
  userId: string;
  weekNumber: number;
  startDate: string;
  endDate: string;
  createdBy: 'ai' | 'manual';
  exercises: PlannedExercise[];
  conversationId: string;
  progressionMode?: 'consistency' | 'gzclp';
  rotationIndex?: number;
}

export interface PlannedExercise {
  id: string;
  planId: string;
  exerciseName: string;
  targetSets: number;
  targetReps: number | string;
  suggestedWeight?: number;
  dayOfWeek: number;
  order: number;
  notes?: string;
  tier?: 'T1' | 'T2' | 'T3';
  stage?: 0 | 1 | 2;
}

export type CardioActivityType = 'run' | 'swim' | 'walk' | 'bike';

export interface CardioLog {
  id: string;
  sessionId: string;
  activityType: CardioActivityType;
  durationSeconds: number;
  distanceMeters?: number;
  notes?: string;
}

export interface WorkoutSession {
  id: string;
  userId: string;
  planId?: string;
  date: string;
  startTime: string;
  endTime?: string;
  completed: boolean;
  loggedExercises: LoggedExercise[];
  sessionType: 'strength' | 'cardio';
  cardioLog?: CardioLog;
}

export interface LoggedExercise {
  id: string;
  sessionId: string;
  plannedExerciseId?: string;
  exerciseName: string;
  sets: ExerciseSet[];
  notes?: string;
}

export interface ExerciseSet {
  setNumber: number;
  reps: number;
  weight: number;
  completed: boolean;
  rpe?: number;
  timestamp: string;
}
