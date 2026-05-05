"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createBrowserClient } from "@/lib/supabase/browser";

export default function SignUpPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const supabase = createBrowserClient();
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });
    setSubmitting(false);
    if (signUpError) {
      setError(signUpError.message);
      return;
    }
    router.push("/onboarding/0");
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-lg px-lg">
      <div className="space-y-2">
        <span className="overline text-xs">Welcome</span>
        <h1 className="headline text-4xl">Create your account</h1>
        <p className="text-fg-secondary text-sm">
          Two quick details, then a short questionnaire so we can build your
          plan.
        </p>
      </div>
      <form onSubmit={onSubmit} className="flex flex-col gap-sm">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-fg-secondary text-xs uppercase tracking-wider">
            Email
          </span>
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border-input-border bg-input-bg text-fg focus:border-primary rounded-md border px-md py-md text-base outline-none"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-fg-secondary text-xs uppercase tracking-wider">
            Password
          </span>
          <input
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border-input-border bg-input-bg text-fg focus:border-primary rounded-md border px-md py-md text-base outline-none"
          />
        </label>
        {error && <p className="text-error text-sm">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="bg-primary text-primary-text mt-sm rounded-full px-lg py-md font-semibold disabled:opacity-50"
        >
          {submitting ? "Creating…" : "Create account"}
        </button>
      </form>
      <p className="text-fg-secondary text-center text-sm">
        Already have an account?{" "}
        <Link href="/sign-in" className="text-primary font-medium underline">
          Sign in
        </Link>
      </p>
    </main>
  );
}
