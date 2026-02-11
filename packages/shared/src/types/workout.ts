export interface WorkoutPlan {
  id: string;
  userId: string;
  weekNumber: number;
  startDate: string;
  endDate: string;
  createdBy: 'ai' | 'manual';
  exercises: PlannedExercise[];
  conversationId: string;
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
