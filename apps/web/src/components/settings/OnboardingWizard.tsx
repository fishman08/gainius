import type { CSSProperties } from 'react';
import { useState, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import { useTheme } from '../../providers/ThemeProvider';
import { useAuth } from '../../providers/AuthProvider';
import { QuestionStep } from './QuestionStep';
import {
  visibleQuestions,
  validateField,
  type Question,
  type QuestionId,
} from '@fitness-tracker/shared';
import type { PartialProfile } from '@fitness-tracker/shared';

interface Props {
  visible: boolean;
  onDismiss: () => void;
}

export function OnboardingWizard({ visible, onDismiss }: Props) {
  const { theme } = useTheme();
  const { supabase, user } = useAuth();
  const [answers, setAnswers] = useState<PartialProfile>({ units_preference: 'metric' });
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);

  const imperial = answers.units_preference === 'imperial';

  useEffect(() => {
    if (!visible || !supabase || !user?.id) return;
    setLoading(true);
    setStep(0);
    setFieldError(null);
    supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()
      .then(({ data, error }) => {
        if (error && error.code !== 'PGRST116') {
          console.error('Failed to load profile:', error.message);
        }
        if (data) {
          const {
            user_id: _uid,
            created_at: _ca,
            updated_at: _ua,
            onboarding_completed_at: _oc,
            ...rest
          } = data;
          setAnswers(rest as PartialProfile);
        } else {
          setAnswers({ units_preference: 'metric' });
        }
        setLoading(false);
      });
  }, [visible, supabase, user?.id]);

  const questions: Question[] = visibleQuestions(answers);
  const total = questions.length;
  const currentQuestion = questions[step];
  const currentValue = currentQuestion
    ? answers[currentQuestion.id as keyof PartialProfile]
    : undefined;

  const handleChange = useCallback(
    (v: unknown) => {
      if (!currentQuestion) return;
      setFieldError(null);
      setAnswers((prev) => ({ ...prev, [currentQuestion.id]: v }));
    },
    [currentQuestion],
  );

  const handleNext = useCallback(async () => {
    if (!currentQuestion) return;
    const val = answers[currentQuestion.id as keyof PartialProfile];
    const result = validateField(currentQuestion.id as QuestionId, val);
    if (!result.ok) {
      setFieldError(result.message);
      return;
    }
    setFieldError(null);
    if (step < total - 1) {
      setStep((s) => s + 1);
    } else {
      if (!supabase || !user?.id) return;
      setSaving(true);
      const { error } = await supabase
        .from('profiles')
        .upsert(
          { user_id: user.id, ...answers, onboarding_completed_at: new Date().toISOString() },
          { onConflict: 'user_id' },
        );
      setSaving(false);
      if (error) {
        setFieldError(`Save failed: ${error.message}`);
      } else {
        onDismiss();
      }
    }
  }, [currentQuestion, answers, step, total, supabase, user?.id, onDismiss]);

  const handleBack = useCallback(() => {
    setFieldError(null);
    setStep((s) => Math.max(0, s - 1));
  }, []);

  const handleFreeTextChange = useCallback((key: string, text: string) => {
    setAnswers((prev) => ({ ...prev, [key]: text.trim() !== '' ? text : null }));
  }, []);

  if (!visible) return null;

  const overlay: CSSProperties = {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(15,23,42,0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: 16,
  };

  const dialog: CSSProperties = {
    background: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    boxShadow: theme.shadows.lg,
    width: '100%',
    maxWidth: 520,
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  };

  const renderContent = () => {
    if (!supabase || !user?.id) {
      return (
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
        >
          <p style={{ color: theme.colors.textSecondary, textAlign: 'center' }}>
            Sign in to your cloud account in the Auth section to use this feature.
          </p>
        </div>
      );
    }
    if (loading) {
      return (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div
            style={{
              width: 32,
              height: 32,
              border: `3px solid ${theme.colors.surfaceBorder}`,
              borderTopColor: theme.colors.primary,
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }}
          />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      );
    }
    if (!currentQuestion) return null;
    return (
      <>
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          <h3
            style={{
              margin: '0 0 8px',
              fontFamily: theme.typography.headline.fontFamily,
              fontSize: theme.typography.headline.fontSize,
              fontWeight: 600,
              color: theme.colors.text,
            }}
          >
            {currentQuestion.title}
          </h3>
          {currentQuestion.help && (
            <p
              style={{
                margin: '0 0 20px',
                fontFamily: theme.typography.body.fontFamily,
                fontSize: theme.typography.body.fontSize,
                color: theme.colors.textSecondary,
              }}
            >
              {currentQuestion.help}
            </p>
          )}
          <QuestionStep
            question={currentQuestion}
            value={currentValue}
            onChange={handleChange}
            imperial={imperial}
            freeTextValue={
              currentQuestion.kind === 'multi' && currentQuestion.freeTextField
                ? ((answers[currentQuestion.freeTextField] as string | undefined) ?? '')
                : undefined
            }
            onFreeTextChange={handleFreeTextChange}
          />
          {fieldError && (
            <p
              style={{
                marginTop: 8,
                fontFamily: theme.typography.caption.fontFamily,
                fontSize: theme.typography.caption.fontSize,
                color: theme.colors.error,
              }}
            >
              {fieldError}
            </p>
          )}
        </div>
        <div
          style={{
            display: 'flex',
            gap: 12,
            padding: 24,
            borderTop: `1px solid ${theme.colors.surfaceBorder}`,
          }}
        >
          <button
            onClick={handleBack}
            disabled={step === 0}
            style={{
              flex: 1,
              padding: '12px 0',
              borderRadius: theme.borderRadius.md,
              border: `1px solid ${theme.colors.surfaceBorder}`,
              backgroundColor: 'transparent',
              color: step === 0 ? theme.colors.textSecondary : theme.colors.text,
              fontFamily: theme.typography.label.fontFamily,
              fontSize: theme.typography.label.fontSize,
              fontWeight: 600,
              cursor: step === 0 ? 'default' : 'pointer',
              opacity: step === 0 ? 0.5 : 1,
            }}
          >
            Back
          </button>
          <button
            onClick={handleNext}
            disabled={saving}
            style={{
              flex: 1,
              padding: '12px 0',
              borderRadius: theme.borderRadius.md,
              border: 'none',
              backgroundColor: theme.colors.primary,
              color: theme.colors.primaryText,
              fontFamily: theme.typography.label.fontFamily,
              fontSize: theme.typography.label.fontSize,
              fontWeight: 600,
              cursor: saving ? 'default' : 'pointer',
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? 'Saving…' : step === total - 1 ? 'Complete' : 'Next'}
          </button>
        </div>
      </>
    );
  };

  return (
    <div
      style={overlay}
      onClick={(e) => {
        if (e.target === e.currentTarget) onDismiss();
      }}
    >
      <div style={dialog}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 24px',
            borderBottom: `1px solid ${theme.colors.surfaceBorder}`,
          }}
        >
          <button
            onClick={onDismiss}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: theme.colors.text,
              padding: 4,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <X size={20} />
          </button>
          {!loading && supabase && user?.id && (
            <span
              style={{
                fontFamily: theme.typography.label.fontFamily,
                fontSize: theme.typography.label.fontSize,
                color: theme.colors.textSecondary,
              }}
            >
              Step {step + 1} of {total}
            </span>
          )}
          <div style={{ width: 28 }} />
        </div>
        {renderContent()}
      </div>
    </div>
  );
}
