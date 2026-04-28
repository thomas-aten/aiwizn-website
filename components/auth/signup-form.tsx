"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function SignupForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
        },
      });
      if (error) throw error;
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign up failed.");
    } finally {
      setPending(false);
    }
  }

  if (done) {
    return (
      <div className="card p-8 text-center">
        <p className="label">Check your inbox</p>
        <h1 className="mt-2 font-display text-3xl text-ink">Confirm your email.</h1>
        <p className="mt-3 text-sm text-ink-2">
          We sent a verification link to <strong>{email}</strong>. Click it to
          activate your AIWIZN account.
        </p>
        <Link href="/login" className="btn-secondary mt-6 inline-flex">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="card p-8">
      <p className="label">Request access</p>
      <h1 className="mt-2 font-display text-3xl text-ink">
        Create your AIWIZN account.
      </h1>
      <p className="mt-2 text-sm text-ink-2">
        Patient, mission-aligned, and credentialed accounts welcome.
      </p>

      <Field id="name" label="Full name" value={name} onChange={setName} required />
      <Field
        id="email"
        label="Email"
        type="email"
        value={email}
        onChange={setEmail}
        required
        autoComplete="email"
      />
      <Field
        id="password"
        label="Password"
        type="password"
        value={password}
        onChange={setPassword}
        required
        autoComplete="new-password"
      />

      {error && (
        <p className="mt-4 rounded-lg border border-orange/30 bg-orange-dim px-3 py-2 text-xs text-orange">
          {error}
        </p>
      )}

      <button type="submit" disabled={pending} className="btn-primary mt-6 w-full">
        {pending ? "Creating account…" : "Create account"}
      </button>

      <p className="mt-6 text-center text-xs text-ink-3">
        Already have an account?{" "}
        <Link href="/login" className="text-ink hover:underline">
          Sign in
        </Link>
      </p>
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
