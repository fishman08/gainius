import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import {
  primaryGoalLabels,
  experienceLabels,
  preferredStyleLabels,
  type PrimaryGoal,
  type ExperienceLevel,
  type PreferredStyle,
} from "@workout/core";

export default async function HomePage() {
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

  if (!profile?.onboarding_completed_at) redirect("/onboarding/0");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://gainius.vercel.app";

  const summary: { label: string; value: string }[] = [
    profile.primary_goal && {
      label: "Goal",
      value: primaryGoalLabels[profile.primary_goal as PrimaryGoal],
    },
    profile.experience_level && {
      label: "Experience",
      value: experienceLabels[profile.experience_level as ExperienceLevel].split(
        " — ",
      )[0]!,
    },
    profile.preferred_style && {
      label: "Style",
      value: preferredStyleLabels[profile.preferred_style as PreferredStyle],
    },
    profile.days_per_week && {
      label: "Days / week",
      value: `${profile.days_per_week} days`,
    },
    profile.session_minutes && {
      label: "Session length",
      value: `${profile.session_minutes} min`,
    },
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <main className="mx-auto max-w-xl px-lg py-2xl">
      <div className="text-center">
        <span className="overline text-xs">Profile complete</span>
        <h1 className="display mt-sm text-5xl leading-[0.95]">
          You&apos;re all set.
        </h1>
        <p className="text-fg-secondary mt-md text-base">
          We have what we need to start curating your plan.
        </p>
      </div>

      {summary.length > 0 && (
        <div className="mt-2xl">
          <h2 className="overline text-xs">Your profile</h2>
          <dl className="border-border bg-surface mt-sm divide-y divide-[var(--surface-border)] rounded-lg border shadow-sm">
            {summary.map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between px-md py-md"
              >
                <dt className="text-fg-secondary text-sm">{row.label}</dt>
                <dd className="text-fg font-medium">{row.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      <div className="mt-2xl">
        <a
          href={appUrl}
          className="bg-primary text-primary-text shadow-glow block rounded-full px-lg py-md text-center font-semibold hover:opacity-90"
        >
          Open the app
        </a>
      </div>
    </main>
  );
}
