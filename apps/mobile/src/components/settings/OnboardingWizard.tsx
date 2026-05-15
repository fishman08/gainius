import React, { useState, useEffect, useCallback } from 'react';
import {
  Modal,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Text, Button, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  visibleQuestions,
  validateField,
  type Question,
  type QuestionId,
} from '@fitness-tracker/shared';
import type { PartialProfile } from '@fitness-tracker/shared';
import { useAppTheme } from '../../providers/ThemeProvider';
import QuestionStep from './QuestionStep';

interface Props {
  visible: boolean;
  onDismiss: () => void;
  supabase: SupabaseClient | null;
  userId: string | undefined;
  imperial: boolean;
}

export default function OnboardingWizard({
  visible,
  onDismiss,
  supabase,
  userId,
  imperial,
}: Props) {
  const { theme } = useAppTheme();
  const [answers, setAnswers] = useState<PartialProfile>({ units_preference: 'metric' });
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible || !supabase || !userId) return;
    setLoading(true);
    setStep(0);
    setFieldError(null);
    supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single()
      .then(({ data, error }) => {
        if (error && error.code !== 'PGRST116') {
          Alert.alert('Load failed', error.message);
        }
        if (data) {
          const {
            user_id: _,
            created_at: __,
            updated_at: ___,
            onboarding_completed_at: ____,
            ...rest
          } = data;
          setAnswers(rest as PartialProfile);
        } else {
          setAnswers({ units_preference: 'metric' });
        }
        setLoading(false);
      });
  }, [visible, supabase, userId]);

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
      if (!supabase || !userId) return;
      setSaving(true);
      const { error } = await supabase
        .from('profiles')
        .upsert(
          { user_id: userId, ...answers, onboarding_completed_at: new Date().toISOString() },
          { onConflict: 'user_id' },
        );
      setSaving(false);
      if (error) {
        Alert.alert('Save failed', error.message);
      } else {
        Alert.alert('Done', 'Profile updated.', [{ text: 'OK', onPress: onDismiss }]);
      }
    }
  }, [currentQuestion, answers, step, total, supabase, userId, onDismiss]);

  const handleBack = useCallback(() => {
    setFieldError(null);
    setStep((s) => Math.max(0, s - 1));
  }, []);

  const handleFreeTextChange = useCallback((key: string, text: string) => {
    setAnswers((prev) => ({ ...prev, [key]: text.trim() !== '' ? text : null }));
  }, []);

  const s = {
    container: { flex: 1, backgroundColor: theme.colors.background },
    header: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      paddingHorizontal: 24,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.surfaceBorder,
    },
    stepLabel: {
      fontFamily: theme.typography.label.fontFamily,
      fontSize: theme.typography.label.fontSize,
      fontWeight: theme.typography.label.fontWeight as unknown as '500',
      color: theme.colors.textSecondary,
    },
    questionTitle: {
      fontFamily: theme.typography.headline.fontFamily,
      fontSize: theme.typography.headline.fontSize,
      fontWeight: theme.typography.headline.fontWeight as unknown as '600',
      color: theme.colors.text,
      marginBottom: 8,
    },
    helpText: {
      fontFamily: theme.typography.body.fontFamily,
      fontSize: theme.typography.body.fontSize,
      color: theme.colors.textSecondary,
      marginBottom: 20,
    },
    errorText: {
      fontFamily: theme.typography.caption.fontFamily,
      fontSize: theme.typography.caption.fontSize,
      color: theme.colors.error,
      marginTop: 8,
    },
    footer: {
      flexDirection: 'row' as const,
      gap: 12,
      padding: 24,
      borderTopWidth: 1,
      borderTopColor: theme.colors.surfaceBorder,
    },
  };

  const renderContent = () => {
    if (!supabase || !userId) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <Text style={{ color: theme.colors.textSecondary, textAlign: 'center' }}>
            Sign in to your cloud account in the Auth section to use this feature.
          </Text>
        </View>
      );
    }
    if (loading) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      );
    }
    if (!currentQuestion) return null;
    return (
      <>
        <ScrollView style={{ flex: 1, padding: 24 }} keyboardShouldPersistTaps="handled">
          <Text style={s.questionTitle}>{currentQuestion.title}</Text>
          {currentQuestion.help && <Text style={s.helpText}>{currentQuestion.help}</Text>}
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
          {fieldError && <Text style={s.errorText}>{fieldError}</Text>}
        </ScrollView>
        <View style={s.footer}>
          <Button mode="outlined" onPress={handleBack} disabled={step === 0} style={{ flex: 1 }}>
            Back
          </Button>
          <Button
            mode="contained"
            onPress={handleNext}
            loading={saving}
            disabled={saving}
            style={{ flex: 1 }}
          >
            {step === total - 1 ? 'Complete' : 'Next'}
          </Button>
        </View>
      </>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onDismiss}
    >
      <SafeAreaView style={s.container}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={s.header}>
            <TouchableOpacity
              onPress={onDismiss}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <MaterialCommunityIcons name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
            {!loading && supabase && userId && (
              <Text style={s.stepLabel}>
                Step {step + 1} of {total}
              </Text>
            )}
            <View style={{ width: 24 }} />
          </View>
          {renderContent()}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}
