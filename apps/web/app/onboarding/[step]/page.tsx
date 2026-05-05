import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import {
  resumeIndex,
  totalVisibleSteps,
  type PartialProfile,
} from "@workout/core";
import { Wizard } from "@/components/questionnaire/Wizard";

export default async function OnboardingStepPage({
  params,
}: {
  params: Promise<{ step: string }>;
}) {
  const { step } = await params;
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  const answers = (profile ?? { units_preference: "metric" }) as PartialProfile;

  const requestedStep = Number.parseInt(step, 10);
  const total = totalVisibleSteps(answers);
  const resume = resumeIndex(answers);

  if (Number.isNaN(requestedStep) || requestedStep < 0) {
    redirect(`/onboarding/${resume}`);
  }
  // Don't let users skip ahead past unanswered questions.
  if (requestedStep > resume) redirect(`/onboarding/${resume}`);
  if (requestedStep >= total) redirect(`/home`);

  return (
    <Wizard
      stepIndex={requestedStep}
      initialAnswers={answers}
      userId={user.id}
    />
  );
}
