export interface ExtractedExercise {
  name: string;
  sets: number;
  reps: number | string; // number or "max" / "failure"
  weight?: number;
  confidence: number; // 0-1
}
