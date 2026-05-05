import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed_at")
    .eq("user_id", user.id)
    .maybeSingle();

  // Lazy-create the profile row for users that pre-existed the signup trigger.
  // RLS allows users to insert their own profile.
  if (!profile) {
    await supabase
      .from("profiles")
      .insert({ user_id: user.id });
  }

  if (profile?.onboarding_completed_at) redirect("/home");

  return <div className="min-h-screen">{children}</div>;
}
