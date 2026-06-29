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
export type { GZCLPTier, GZCLPSuggestion } from './gzclpProgression';
export { resolveGZCLP, deriveIsLower, GZCLP_ROTATION } from './gzclpProgression';
export type { ProgressionResult } from './progressionStrategy';
export { resolveProgressionForPlan } from './progressionStrategy';
