"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") ?? "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setPending(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      router.push(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed.");
    } finally {
      setPending(false);
    }
  }

  async function onMagicLink() {
    setError(null);
    setInfo(null);
    if (!email) {
      setError("Enter your email first.");
      return;
    }
    setPending(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      });
      if (error) throw error;
      setInfo("Magic link sent. Check your inbox.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send magic link.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="card p-8">
      <p className="label">Sign in</p>
      <h1 className="mt-2 font-display text-3xl text-ink">Welcome back.</h1>
      <p className="mt-2 text-sm text-ink-2">
        Access the AIWIZN workspace.
      </p>

      <Field
        id="email"
        label="Email"
        type="email"
        value={email}
        onChange={setEmail}
        autoComplete="email"
        required
      />
      <Field
        id="password"
        label="Password"
        type="password"
        value={password}
        onChange={setPassword}
        autoComplete="current-password"
        required
      />

      {error && (
        <p className="mt-4 rounded-lg border border-orange/30 bg-orange-dim px-3 py-2 text-xs text-orange">
          {error}
        </p>
      )}
      {info && (
        <p className="mt-4 rounded-lg border border-teal/30 bg-teal-dim px-3 py-2 text-xs text-teal-dark">
          {info}
        </p>
      )}

      <button type="submit" disabled={pending} className="btn-primary mt-6 w-full">
        {pending ? "Signing in…" : "Sign in"}
      </button>
      <button
        type="button"
        onClick={onMagicLink}
        disabled={pending}
        className="btn-secondary mt-3 w-full"
      >
        Send magic link
      </button>

      <div className="mt-6 flex items-center justify-between text-xs">
        <Link href="/forgot-password" className="text-ink-3 hover:text-ink">
          Forgot password?
        </Link>
        <Link href="/signup" className="text-ink-3 hover:text-ink">
          Need access? Sign up
        </Link>
      </div>
    </form>
  );
}

function Field({
  id,
  label,
  type = "text",
  value,
  onChange,
  required,
  autoComplete,
}: {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  autoComplete?: string;
}) {
  return (
    <label className="mt-5 block">
      <span className="label">{label}</span>
      <input
        id={id}
        name={id}
        type={type}
        required={required}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full rounded-lg border border-ink/15 bg-white/70 px-3 py-2 text-sm focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30"
      />
    </label>
  );
}
