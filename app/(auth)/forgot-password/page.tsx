"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
      });
      if (error) throw error;
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send reset email.");
    } finally {
      setPending(false);
    }
  }

  if (done) {
    return (
      <div className="card p-8 text-center">
        <p className="label">Check your inbox</p>
        <h1 className="mt-2 font-display text-3xl text-ink">Reset link sent.</h1>
        <p className="mt-3 text-sm text-ink-2">
          We emailed instructions to <strong>{email}</strong>.
        </p>
        <Link href="/login" className="btn-secondary mt-6 inline-flex">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="card p-8">
      <p className="label">Forgot password</p>
      <h1 className="mt-2 font-display text-3xl text-ink">Reset your password.</h1>
      <p className="mt-2 text-sm text-ink-2">
        Enter the email associated with your AIWIZN account.
      </p>
      <label className="mt-5 block">
        <span className="label">Email</span>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-2 w-full rounded-lg border border-ink/15 bg-white/70 px-3 py-2 text-sm focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30"
        />
      </label>
      {error && (
        <p className="mt-4 rounded-lg border border-orange/30 bg-orange-dim px-3 py-2 text-xs text-orange">
          {error}
        </p>
      )}
      <button type="submit" disabled={pending} className="btn-primary mt-6 w-full">
        {pending ? "Sending…" : "Send reset link"}
      </button>
      <p className="mt-6 text-center text-xs text-ink-3">
        <Link href="/login" className="hover:text-ink">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
