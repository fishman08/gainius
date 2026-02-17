export type ExerciseType = 'warmup' | 'working' | 'cooldown' | 'superset';

export interface ExtractedExercise {
  name: string;
  sets: number;
  reps: number | string; // number or "max" / "failure"
  weight?: number;
  confidence: number; // 0-1
  dayOfWeek?: number; // 0=Sunday through 6=Saturday
  exerciseType?: ExerciseType;
  supersetGroup?: string;
}
