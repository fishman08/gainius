import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";

export default async function Page() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_completed_at")
      .eq("user_id", user.id)
      .maybeSingle();
    if (profile?.onboarding_completed_at) redirect("/home");
    redirect("/onboarding/0");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="text-4xl font-semibold tracking-tight">Workout</h1>
      <p className="text-muted">
        AI-curated training, built around your goals, equipment, and schedule.
      </p>
      <div className="flex w-full flex-col gap-3">
        <Link
          href="/sign-up"
          className="rounded-xl bg-accent px-5 py-3 text-center font-medium text-bg hover:opacity-90"
        >
          Get started
        </Link>
        <Link
          href="/sign-in"
          className="rounded-xl border border-border px-5 py-3 text-center font-medium hover:bg-surface"
        >
          Sign in
        </Link>
      </div>
    </main>
  );
}
