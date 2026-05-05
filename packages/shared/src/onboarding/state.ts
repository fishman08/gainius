import type { PartialProfile, Profile } from './schema';
import { FieldSchemas } from './schema';
import {
  isQuestionVisible,
  nextUnansweredIndex,
  onboardingQuestions,
  visibleQuestions,
  type Question,
  type QuestionId,
} from './questions';

export type ProfileFieldUpdate = Partial<Profile>;

export type SaveAnswerResult = { ok: true } | { ok: false; message: string };

/**
 * Adapter shape: each platform implements how to read/write the profile.
 * Web → server actions or supabase-js browser client.
 * Mobile → supabase-js with AsyncStorage adapter.
 */
export type ProfileRepo = {
  fetch(): Promise<PartialProfile>;
  save(update: ProfileFieldUpdate): Promise<SaveAnswerResult>;
  complete(update: ProfileFieldUpdate): Promise<SaveAnswerResult>;
};

export function validateField(
  id: QuestionId,
  rawValue: unknown,
): { ok: true; value: unknown } | { ok: false; message: string } {
  const schema = FieldSchemas[id as keyof typeof FieldSchemas];
  const result = schema.safeParse(rawValue);
  if (!result.success) {
    const first = result.error.issues[0];
    return { ok: false, message: first?.message ?? 'Invalid value' };
  }
  return { ok: true, value: result.data };
}

export function questionAtVisibleIndex(index: number, answers: PartialProfile): Question | null {
  const visible = visibleQuestions(answers);
  return visible[index] ?? null;
}

export function totalVisibleSteps(answers: PartialProfile): number {
  return visibleQuestions(answers).length;
}

export function isQuestionnaireComplete(answers: PartialProfile): boolean {
  return onboardingQuestions
    .filter((q) => isQuestionVisible(q, answers))
    .every((q) => {
      const v = answers[q.id];
      if (v === undefined || v === null) return false;
      if (Array.isArray(v)) return v.length > 0;
      if (typeof v === 'string') return v.length > 0;
      return true;
    });
}

export function resumeIndex(answers: PartialProfile): number {
  return nextUnansweredIndex(answers);
}
