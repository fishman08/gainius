"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  isQuestionnaireComplete,
  questionAtVisibleIndex,
  totalVisibleSteps,
  validateField,
  type PartialProfile,
  type Question,
  type QuestionId,
} from "@workout/core";
import { createBrowserClient } from "@/lib/supabase/browser";
import type { ProfileUpdate } from "@workout/db";
import { ProgressBar } from "./ProgressBar";
import { SingleChoice } from "./SingleChoice";
import { NumberChoice } from "./NumberChoice";
import { MultiChoice } from "./MultiChoice";
import { DateInput } from "./DateInput";
import { MeasurementInput } from "./MeasurementInput";

type Props = {
  stepIndex: number;
  initialAnswers: PartialProfile;
  userId: string;
};

export function Wizard({ stepIndex, initialAnswers, userId }: Props) {
  const router = useRouter();
  const [answers, setAnswers] = useState<PartialProfile>(initialAnswers);
  const [pending, setPending] = useState<unknown>(undefined);
  const [pendingExtra, setPendingExtra] = useState<Record<string, unknown>>({});
  const [unitsPref, setUnitsPref] = useState(answers.units_preference ?? "metric");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const question = useMemo<Question | null>(
    () => questionAtVisibleIndex(stepIndex, answers),
    [stepIndex, answers],
  );

  const total = totalVisibleSteps(answers);

  if (!question) {
    return (
      <div className="mx-auto max-w-md px-6 py-12 text-center">
        Loading…
      </div>
    );
  }

  async function handleNext() {
    if (!question) return;
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
      const merged = { ...answers, ...update } as PartialProfile;
      if (isQuestionnaireComplete(merged)) {
        update.onboarding_completed_at = new Date().toISOString();
      }
    }

    setSaving(true);
    const supabase = createBrowserClient();
    const { error: dbError } = await supabase
      .from("profiles")
      .update(update as ProfileUpdate)
      .eq("user_id", userId);
    setSaving(false);

    if (dbError) {
      setError(dbError.message);
      return;
    }

    const merged = { ...answers, ...update } as PartialProfile;
    setAnswers(merged);
    setPending(undefined);
    setPendingExtra({});

    if (isLast) {
      router.push("/home");
      router.refresh();
      return;
    }
    router.push(`/onboarding/${stepIndex + 1}`);
  }

  function handleBack() {
    if (stepIndex === 0) return;
    router.push(`/onboarding/${stepIndex - 1}`);
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col px-6 py-8">
      <ProgressBar current={stepIndex + 1} total={total} />

      <div className="mt-10 flex-1">
        <h2 className="text-2xl font-semibold tracking-tight">{question.title}</h2>
        {question.help && (
          <p className="text-muted mt-2 text-sm">{question.help}</p>
        )}

        <div className="mt-8">
          {renderControl(question, {
            value: pending,
            onChange: setPending,
            extra: pendingExtra,
            onChangeExtra: setPendingExtra,
            unitsPref,
            onChangeUnitsPref: setUnitsPref,
            initialValue: answers[question.id as keyof PartialProfile],
            initialExtra:
              question.kind === "multi" && question.freeTextField
                ? { [question.freeTextField]: answers[question.freeTextField as keyof PartialProfile] }
                : undefined,
          })}
        </div>

        {error && <p className="text-danger mt-4 text-sm">{error}</p>}
      </div>

      <div className="mt-8 flex gap-3">
        <button
          type="button"
          onClick={handleBack}
          disabled={stepIndex === 0 || saving}
          className="rounded-xl border border-border px-5 py-3 font-medium hover:bg-surface disabled:opacity-30"
        >
          Back
        </button>
        <button
          type="button"
          onClick={handleNext}
          disabled={saving}
          className="flex-1 rounded-xl bg-accent px-5 py-3 font-medium text-bg disabled:opacity-50"
        >
          {saving ? "Saving…" : stepIndex === total - 1 ? "Finish" : "Next"}
        </button>
      </div>
    </div>
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
          value={(props.value as string | undefined) ?? (props.initialValue as string | undefined)}
          onChange={props.onChange}
        />
      );
    case "number_choice":
      return (
        <NumberChoice
          options={question.options}
          value={(props.value as number | undefined) ?? (props.initialValue as number | undefined)}
          onChange={(v) => props.onChange(v)}
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
                (props.initialExtra?.[question.freeTextField] as string | undefined) ??
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
          onChange={(v) => props.onChange(v)}
        />
      );
  }
}
