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
    <main className="mx-auto max-w-2xl px-lg py-2xl">
      <span className="overline text-xs">Profile complete</span>
      <h1 className="headline text-4xl mt-sm">You&apos;re all set</h1>
      <p className="text-fg-secondary mt-sm">
        We&apos;ve got everything we need. Your AI-curated plan is the next
        thing we&apos;ll build.
      </p>
      <pre className="border-border bg-surface mt-xl overflow-auto rounded-lg border p-md text-xs font-mono">
        {JSON.stringify(profile, null, 2)}
      </pre>
    </main>
  );
}
