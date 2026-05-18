import type { ChatMessage } from '../types';
import { sendMessage } from './claudeClient';

export const ANALYSIS_MODEL = 'claude-haiku-4-5-20251001';
export const MIN_MESSAGES_FOR_ANALYSIS = 10;

export function buildAnalysisPrompt(messages: ChatMessage[], existingNotes: string | null): string {
  const recent = messages.slice(-20);
  const conversation = recent
    .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
    .join('\n');

  const notesPreamble = existingNotes ? `Current coaching notes:\n${existingNotes}\n\n` : '';

  return `${notesPreamble}Analyze the fitness coaching conversation below and extract any meaningful, persistent user preferences or patterns.

Focus on:
- Explicit preferences stated ("I don't like X", "I prefer Y")
- Difficulty calibration signals ("too easy", "too hard", "increase more aggressively")
- Communication style preferences (concise vs detailed explanations)
- Exercise preferences or aversions
- Scheduling or lifestyle patterns that affect training

Rules:
- Only capture persistent, meaningful preferences — not one-off comments
- Be concise (200 words max total)
- Merge with existing notes — don't repeat what's already captured, just add or update
- If nothing new was learned, return the existing notes unchanged
- If there are no notes yet and nothing was learned, return an empty string
- Return ONLY the coaching notes text, no preamble or explanation

Conversation:
${conversation}`;
}

export interface CoachingAnalysisOptions {
  apiKey: string;
  messages: ChatMessage[];
  existingNotes: string | null;
}

export async function analyzeConversationForInsights(
  options: CoachingAnalysisOptions,
): Promise<string | null> {
  const { apiKey, messages, existingNotes } = options;

  if (messages.length < MIN_MESSAGES_FOR_ANALYSIS) return null;

  try {
    const result = await sendMessage({
      apiKey,
      model: ANALYSIS_MODEL,
      maxTokens: 300,
      messages: [{ role: 'user', content: buildAnalysisPrompt(messages, existingNotes) }],
    });

    return result.text.trim() || null;
  } catch {
    return null;
  }
}
