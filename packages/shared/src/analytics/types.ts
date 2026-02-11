export type TimePeriod = 'week' | 'month' | 'all';

export interface WorkoutStats {
  totalWorkouts: number;
  totalVolume: number;
  totalSets: number;
  avgWorkoutsPerWeek: number;
}

export interface PersonalRecord {
  exerciseName: string;
  weight: number;
  reps: number;
  date: string;
  previousBest: number | null;
}

export interface ExerciseDataPoint {
  date: string;
  weight: number;
  reps: number;
  volume: number;
}

export interface ExerciseAnalytics {
  exerciseName: string;
  dataPoints: ExerciseDataPoint[];
  bestWeight: number;
  bestVolume: number;
  avgWeight: number;
  totalSets: number;
  sessionCount: number;
}

export interface WeeklyVolume {
  weekLabel: string;
  volume: number;
  sessionCount: number;
}

export interface WeightSuggestion {
  exerciseName: string;
  currentWeight: number;
  suggestedWeight: number;
  direction: 'increase' | 'same' | 'decrease';
  confidence: 'high' | 'medium' | 'low';
  reason: string;
}
