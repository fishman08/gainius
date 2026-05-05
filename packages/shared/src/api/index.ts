export { sendMessage, validateApiKey, ClaudeApiError } from './claudeClient';
export { buildSystemPrompt, buildSessionReviewPrompt } from './contextBuilder';
export type {
  ContextOptions,
  PreviousPlanData,
  ExerciseProgression,
  KnowledgeSnippet,
} from './contextBuilder';
export type { ClaudeMessage, SendMessageOptions, SendMessageResult } from './types';
