"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createBrowserClient } from "@/lib/supabase/browser";

export default function SignInPage() {
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
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setSubmitting(false);
    if (signInError) {
      setError(signInError.message);
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-lg px-lg">
      <div className="space-y-2">
        <span className="overline text-xs">Welcome back</span>
        <h1 className="headline text-4xl">Sign in</h1>
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
            autoComplete="current-password"
            required
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
          {submitting ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <p className="text-fg-secondary text-center text-sm">
        New here?{" "}
        <Link href="/sign-up" className="text-primary font-medium underline">
          Create an account
        </Link>
      </p>
    </main>
  );
}
