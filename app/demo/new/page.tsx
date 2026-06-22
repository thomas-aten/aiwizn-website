import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isDemoHubAllowed } from "@/lib/demoHubAllowlist";
import { Builder } from "./Builder";

/**
 * /demo/new — channel-partner self-serve builder (Paul Palamara, Pinnacle Mx
 * Group). Enter a hospital name + accent color + the contact you're reaching,
 * get back a branded clinical-engine link AND a copy-pasteable draft intro
 * email.
 *
 * Same three-gate access control as /demo (see app/demo/page.tsx):
 *
 *   1. Anonymous (no Supabase session)            → redirect to /login.
 *   2. Authenticated but not on the invite list   → redirect to / (no leak).
 *   3. Authenticated + allow-listed               → render the builder.
 *
 * Read-only: link + email are computed client-side from the form inputs. No
 * Supabase writes, no new tables, no new cookies — just the existing SSR
 * session check shared with /demo.
 */

export const metadata: Metadata = {
  title: "Build a hospital intro",
  description: "Internal — gated link + intro-email builder.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false, noimageindex: true },
  },
};

// Disable static generation — the auth gate must run on every request.
export const dynamic = "force-dynamic";

/** Best-effort first name from the Supabase user, fallback "Paul". */
function senderFirstName(user: {
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
}): string {
  const meta = user.user_metadata ?? {};
  const full =
    (typeof meta.full_name === "string" && meta.full_name) ||
    (typeof meta.name === "string" && meta.name) ||
    "";
  const first = full.trim().split(/\s+/)[0];
  if (first) return first;
  return "Paul";
}

export default async function DemoNewPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Gate 1 — anonymous.
  if (!user) redirect("/login?next=/demo/new");

  // Gate 2 — authenticated but not allow-listed. Redirect to the marketing
  // root rather than a 403 so we don't disclose the builder's existence.
  if (!isDemoHubAllowed(user.email)) redirect("/");

  const defaultSender = senderFirstName(user);

  return (
    <main className="min-h-screen bg-cream-light">
      <div className="container py-16 md:py-24">
        <p className="label">Internal · Demo hub · Builder</p>
        <h1 className="mt-3 max-w-3xl font-display text-4xl italic leading-[1.05] text-ink md:text-6xl">
          Build a hospital intro in 60 seconds.
        </h1>
        <p className="mt-6 max-w-prose text-lg leading-relaxed text-ink-2">
          Enter the hospital, pick its brand color, and name the person you&apos;re
          reaching. You&apos;ll get a preconfigured, no-login clinical-engine link
          and a warm draft intro email — both ready to edit and send.
        </p>
        <p className="mt-6 inline-flex rounded-full border border-ink/15 bg-white/60 px-3 py-1 font-mono text-[10px] uppercase tracking-label text-ink-2">
          Confidential · Do not redistribute
        </p>

        <Builder defaultSender={defaultSender} />

        <div className="mt-16 border-t border-ink/10 pt-8">
          <p className="font-mono text-[10px] uppercase tracking-label text-ink-3">
            Signed in as {user.email}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-ink-3">
            Links carry the tenant config in the URL hash and open without
            sign-in. Need a short demo.aiwizn.com/&lt;slug&gt; link provisioned?
            Ask Thomas.
          </p>
        </div>
      </div>
    </main>
  );
}
