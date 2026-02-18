export type ExerciseType = 'warmup' | 'working' | 'cooldown' | 'superset';

export interface ExtractedExercise {
  name: string;
  sets: number;
  reps: number | string; // number or "max" / "failure"
  weight?: number;
  confidence: number; // 0-1
  dayOfWeek?: number; // 0=Sun..6=Sat, from **Day** headers
  exerciseType?: ExerciseType; // from section headers or superset prefix
  supersetGroup?: string; // e.g. "A", "B"
}
