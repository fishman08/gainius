import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  isQuestionnaireComplete,
  questionAtVisibleIndex,
  resumeIndex,
  totalVisibleSteps,
  validateField,
  type PartialProfile,
  type Question,
  type QuestionId,
} from "@workout/core";
import { useSession } from "@/hooks/useSession";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/lib/supabase";
import type { ProfileUpdate } from "@workout/db";
import { colors, radius, spacing } from "@/lib/theme";
import { ProgressBar } from "@/components/questionnaire/ProgressBar";
import { SingleChoice } from "@/components/questionnaire/SingleChoice";
import { NumberChoice } from "@/components/questionnaire/NumberChoice";
import { MultiChoice } from "@/components/questionnaire/MultiChoice";
import { DateInput } from "@/components/questionnaire/DateInput";
import { MeasurementInput } from "@/components/questionnaire/MeasurementInput";

export default function OnboardingStep() {
  const router = useRouter();
  const { step } = useLocalSearchParams<{ step: string }>();
  const stepIndex = Number.parseInt(step ?? "0", 10) || 0;

  const { session, loading: loadingSession } = useSession();
  const { profile, loading: loadingProfile, refetch } = useProfile(
    session?.user.id,
  );

  const [pending, setPending] = useState<unknown>(undefined);
  const [pendingExtra, setPendingExtra] = useState<Record<string, unknown>>({});
  const [unitsPref, setUnitsPref] = useState<"metric" | "imperial">("metric");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile?.units_preference) setUnitsPref(profile.units_preference);
  }, [profile?.units_preference]);

  useEffect(() => {
    if (!loadingSession && !session) {
      router.replace("/(auth)/sign-up");
    }
  }, [loadingSession, session, router]);

  useEffect(() => {
    if (!profile) return;
    if (profile.onboarding_completed_at) {
      router.replace("/home");
      return;
    }
    const resume = resumeIndex(profile);
    if (stepIndex > resume) router.replace(`/onboarding/${resume}`);
  }, [profile, stepIndex, router]);

  const question = useMemo<Question | null>(() => {
    if (!profile) return null;
    return questionAtVisibleIndex(stepIndex, profile);
  }, [stepIndex, profile]);

  if (loadingSession || loadingProfile || !profile || !question) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  const total = totalVisibleSteps(profile);

  async function handleNext() {
    if (!question || !session) return;
    setError(null);

    const validation = validateField(question.id as QuestionId, pending);
    if (!validation.ok) {
      setError(validation.message);
      return;
    }

    const update: Record<string, unknown> = {
      [question.id]: validation.value,
      ...pendingExtra,
      units_preference: unitsPref,
    };

    const isLast = stepIndex === total - 1;
    if (isLast) {
      const merged = { ...profile, ...update } as PartialProfile;
      if (isQuestionnaireComplete(merged)) {
        update.onboarding_completed_at = new Date().toISOString();
      }
    }

    setSaving(true);
    const { error: dbError } = await supabase
      .from("profiles")
      .update(update as ProfileUpdate)
      .eq("user_id", session.user.id);
    setSaving(false);

    if (dbError) {
      setError(dbError.message);
      return;
    }

    setPending(undefined);
    setPendingExtra({});
    await refetch();

    if (isLast) {
      router.replace("/home");
      return;
    }
    router.push(`/onboarding/${stepIndex + 1}`);
  }

  function handleBack() {
    if (stepIndex === 0) return;
    router.back();
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <View style={styles.padded}>
          <ProgressBar current={stepIndex + 1} total={total} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>{question.title}</Text>
          {question.help && <Text style={styles.help}>{question.help}</Text>}

          <View style={{ marginTop: spacing.xl }}>
            {renderControl(question, {
              value: pending,
              onChange: setPending,
              extra: pendingExtra,
              onChangeExtra: setPendingExtra,
              unitsPref,
              onChangeUnitsPref: setUnitsPref,
              initialValue: profile[question.id as keyof PartialProfile],
              initialExtra:
                question.kind === "multi" && question.freeTextField
                  ? {
                      [question.freeTextField]:
                        profile[question.freeTextField as keyof PartialProfile],
                    }
                  : undefined,
            })}
          </View>

          {error && <Text style={styles.error}>{error}</Text>}
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            onPress={handleBack}
            disabled={stepIndex === 0 || saving}
            style={({ pressed }) => [
              styles.backButton,
              {
                opacity: stepIndex === 0 ? 0.3 : pressed ? 0.7 : 1,
              },
            ]}
          >
            <Text style={styles.backText}>Back</Text>
          </Pressable>
          <Pressable
            onPress={handleNext}
            disabled={saving}
            style={({ pressed }) => [
              styles.nextButton,
              { opacity: saving ? 0.5 : pressed ? 0.85 : 1 },
            ]}
          >
            <Text style={styles.nextText}>
              {saving ? "Saving…" : stepIndex === total - 1 ? "Finish" : "Next"}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

type ControlProps = {
  value: unknown;
  onChange: (v: unknown) => void;
  extra: Record<string, unknown>;
  onChangeExtra: (v: Record<string, unknown>) => void;
  unitsPref: "metric" | "imperial";
  onChangeUnitsPref: (v: "metric" | "imperial") => void;
  initialValue: unknown;
  initialExtra?: Record<string, unknown>;
};

function renderControl(question: Question, props: ControlProps) {
  switch (question.kind) {
    case "single":
      return (
        <SingleChoice
          options={question.options}
          value={
            (props.value as string | undefined) ??
            (props.initialValue as string | undefined)
          }
          onChange={props.onChange}
        />
      );
    case "number_choice":
      return (
        <NumberChoice
          options={question.options}
          value={
            (props.value as number | undefined) ??
            (props.initialValue as number | undefined)
          }
          onChange={props.onChange}
        />
      );
    case "multi":
      return (
        <MultiChoice
          options={question.options}
          value={
            (props.value as string[] | undefined) ??
            (props.initialValue as string[] | undefined) ??
            []
          }
          onChange={props.onChange}
          freeTextLabel={question.freeTextLabel}
          freeTextValue={
            question.freeTextField
              ? (props.extra[question.freeTextField] as string | undefined) ??
                (props.initialExtra?.[question.freeTextField] as
                  | string
                  | undefined) ??
                ""
              : undefined
          }
          onChangeFreeText={
            question.freeTextField
              ? (text) =>
                  props.onChangeExtra({
                    ...props.extra,
                    [question.freeTextField as string]: text || null,
                  })
              : undefined
          }
        />
      );
    case "date":
      return (
        <DateInput
          value={
            (props.value as string | undefined) ??
            (props.initialValue as string | undefined)
          }
          onChange={props.onChange}
        />
      );
    case "measurement":
      return (
        <MeasurementInput
          metric={question.metric}
          unitsPref={props.unitsPref}
          onChangeUnitsPref={props.onChangeUnitsPref}
          value={
            (props.value as number | undefined) ??
            (props.initialValue as number | undefined)
          }
          onChange={props.onChange}
        />
      );
  }
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.bg,
  },
  padded: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    flexGrow: 1,
  },
  title: { color: colors.text, fontSize: 24, fontWeight: "600" },
  help: { color: colors.muted, fontSize: 14, marginTop: spacing.sm },
  error: { color: colors.danger, fontSize: 14, marginTop: spacing.lg },
  footer: {
    flexDirection: "row",
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
  },
  backButton: {
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.surface,
  },
  backText: { color: colors.text, fontWeight: "600" },
  nextButton: {
    flex: 1,
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingVertical: spacing.lg,
    alignItems: "center",
  },
  nextText: { color: colors.bg, fontWeight: "600", fontSize: 16 },
});
