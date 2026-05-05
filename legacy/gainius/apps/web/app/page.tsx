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
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-lg px-lg text-center">
      <span className="overline text-xs">Gainius</span>
      <h1 className="display text-5xl leading-[0.95]">
        Train smarter,
        <br />
        not harder.
      </h1>
      <p className="text-fg-secondary text-base">
        AI-curated training, built around your goals, equipment, and schedule.
      </p>
      <div className="mt-md flex w-full flex-col gap-sm">
        <Link
          href="/sign-up"
          className="bg-primary text-primary-text shadow-glow rounded-full px-lg py-md text-center font-semibold hover:opacity-90"
        >
          Get started
        </Link>
        <Link
          href="/sign-in"
          className="border-border hover:bg-surface text-fg rounded-full border px-lg py-md text-center font-medium"
        >
          Sign in
        </Link>
      </div>
    </main>
  );
}
