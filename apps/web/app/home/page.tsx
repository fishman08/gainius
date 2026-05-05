import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";

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

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-3xl font-semibold">You're all set</h1>
      <p className="text-muted mt-2">
        We've got everything we need. Your AI-curated plan is the next thing
        we'll build.
      </p>
      <pre className="mt-8 overflow-auto rounded-xl border border-border bg-surface p-4 text-sm">
        {JSON.stringify(profile, null, 2)}
      </pre>
    </main>
  );
}
