export type GZCLPTier = 'T1' | 'T2' | 'T3';

export interface GZCLPSuggestion {
  exerciseName: string;
  tier: GZCLPTier;
  schemeLabel: string;
  suggestedWeight: number;
  newStage: 0 | 1 | 2 | null;
  transitionReason?: string;
}

const T1_SCHEMES = ['5x3+', '6x2+', '10x1+'] as const;
const T2_SCHEMES = ['3x10', '3x8', '3x6'] as const;
const T3_SCHEME = '3x15+';

export const GZCLP_ROTATION = [
  {
    label: 'A1',
    exercises: [
      { exerciseName: 'Squat', tier: 'T1' as GZCLPTier },
      { exerciseName: 'Bench Press', tier: 'T2' as GZCLPTier },
      { exerciseName: 'Lat Pulldown', tier: 'T3' as GZCLPTier },
    ],
  },
  {
    label: 'B1',
    exercises: [
      { exerciseName: 'OHP', tier: 'T1' as GZCLPTier },
      { exerciseName: 'Deadlift', tier: 'T2' as GZCLPTier },
      { exerciseName: 'DB Row', tier: 'T3' as GZCLPTier },
    ],
  },
  {
    label: 'A2',
    exercises: [
      { exerciseName: 'Bench Press', tier: 'T1' as GZCLPTier },
      { exerciseName: 'Squat', tier: 'T2' as GZCLPTier },
      { exerciseName: 'Lat Pulldown', tier: 'T3' as GZCLPTier },
    ],
  },
  {
    label: 'B2',
    exercises: [
      { exerciseName: 'Deadlift', tier: 'T1' as GZCLPTier },
      { exerciseName: 'OHP', tier: 'T2' as GZCLPTier },
      { exerciseName: 'DB Row', tier: 'T3' as GZCLPTier },
    ],
  },
] as const;

export function deriveIsLower(exerciseName: string): boolean {
  const lower = exerciseName.toLowerCase();
  return lower.includes('squat') || lower.includes('deadlift');
}

function round5(w: number): number {
  return Math.round(w / 5) * 5;
}

interface ExerciseInput {
  tier: GZCLPTier;
  stage?: 0 | 1 | 2;
  exerciseName: string;
  suggestedWeight?: number;
}

interface LastSetInput {
  reps: number;
  hitAllReps: boolean;
}

interface GZCLPResolution {
  newStage: 0 | 1 | 2 | null;
  suggestedWeight: number;
  schemeLabel: string;
  transitionReason?: string;
}

export function resolveGZCLP(exercise: ExerciseInput, lastSet: LastSetInput): GZCLPResolution {
  const { tier, exerciseName } = exercise;
  const stage = exercise.stage ?? 0;
  const weight = exercise.suggestedWeight ?? 0;
  const inc = deriveIsLower(exerciseName) ? 10 : 5;

  if (tier === 'T1') {
    const minReps = [3, 2, 1][stage] as number;
    if (lastSet.reps >= minReps) {
      return {
        newStage: stage as 0 | 1 | 2,
        suggestedWeight: round5(weight + inc),
        schemeLabel: T1_SCHEMES[stage],
      };
    }
    if (stage < 2) {
      const newStage = (stage + 1) as 1 | 2;
      return {
        newStage,
        suggestedWeight: weight,
        schemeLabel: T1_SCHEMES[newStage],
        transitionReason: `dropped to ${T1_SCHEMES[newStage]}, missed the AMRAP minimum last session`,
      };
    }
    return {
      newStage: 0,
      suggestedWeight: round5(weight * 0.9),
      schemeLabel: T1_SCHEMES[0],
      transitionReason: `reset to ${T1_SCHEMES[0]} at -10% weight, failed stage 2`,
    };
  }

  if (tier === 'T2') {
    if (lastSet.hitAllReps) {
      return {
        newStage: stage as 0 | 1 | 2,
        suggestedWeight: round5(weight + inc),
        schemeLabel: T2_SCHEMES[stage],
      };
    }
    if (stage < 2) {
      const newStage = (stage + 1) as 1 | 2;
      return {
        newStage,
        suggestedWeight: weight,
        schemeLabel: T2_SCHEMES[newStage],
        transitionReason: `dropped to ${T2_SCHEMES[newStage]}, missed reps last session`,
      };
    }
    return {
      newStage: 0,
      suggestedWeight: weight,
      schemeLabel: T2_SCHEMES[0],
      transitionReason: `reset to ${T2_SCHEMES[0]}, same weight`,
    };
  }

  // T3 — 3x15+, progress when last set hits 25+
  if (lastSet.reps >= 25) {
    return { newStage: null, suggestedWeight: round5(weight + 5), schemeLabel: T3_SCHEME };
  }
  return { newStage: null, suggestedWeight: weight, schemeLabel: T3_SCHEME };
}
