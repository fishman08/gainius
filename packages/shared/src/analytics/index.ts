export type {
  TimePeriod,
  WorkoutStats,
  PersonalRecord,
  ExerciseAnalytics,
  ExerciseDataPoint,
  WeeklyVolume,
  WeightSuggestion,
} from './types';

export {
  filterByPeriod,
  computeStats,
  getUniqueExercises,
  computeExerciseAnalytics,
  detectPersonalRecords,
  getRecentPRs,
  computeWeeklyVolume,
} from './analytics';

export { suggestWeight, suggestWeightsForPlan } from './weightSuggestion';
export type { SuggestWeightOptions } from './weightSuggestion';
export type { GZCLPTier, GZCLPSuggestion } from './gzclpProgression';
export { resolveGZCLP, deriveIsLower, GZCLP_ROTATION, seedT2Weight } from './gzclpProgression';
export type { ProgressionResult } from './progressionStrategy';
export { resolveProgressionForPlan } from './progressionStrategy';
export type { ProgramDayDef, ProgramExerciseDef } from './phulProgram';
export { PHUL_ROTATION, buildPhulPlan } from './phulProgram';
export {
  isRotationPlan,
  getSessionExercises,
  nextRotationIndex,
  getRotationLabel,
  usesPlannedRepTargets,
  findSuggestionForExercise,
} from './programTemplate';
