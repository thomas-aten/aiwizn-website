import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isDemoHubAllowed } from "@/lib/demoHubAllowlist";
import {
  buildClinicalEngineLink,
  uncMedicalCenterConfig,
  dukeUniversityConfig,
  alleghenyHealthNetworkConfig,
} from "@/lib/demoTenantLinks";
import {
  tenantConfigFor,
  encodeConfigHash,
  CLINICAL_ENGINE_URL,
} from "@/lib/cohortInviteBuilder";
import { Builder } from "./Builder";

/**
 * /cohort-invite — gated cohort-invite builder (Thomas task list item 4).
 *
 * The website-domain, allowlist-gated successor to the engine-repo
 * `cohort-invite.html` / `duke-cohort-invite.html` static tools (which remain
 * FROZEN and in production use). Same three-gate access control as /demo and
 * /demo/new (see app/demo/page.tsx):
 *
 *   1. Anonymous (no Supabase session)            → redirect to /login.
 *   2. Authenticated but not on the invite list   → redirect to / (no leak).
 *   3. Authenticated + allow-listed               → render the builder.
 *
 * Paul Palamara (palamara@pinnaclemx.com) is already on the invite list
 * (lib/demoHubAllowlist.ts). Read-only — link + email are computed client-side
 * from the form inputs. No Supabase writes, no new tables.
 */

export const metadata: Metadata = {
  title: "Cohort invite builder",
  description: "Internal — gated cohort-invite link + email builder.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false, noimageindex: true },
  },
};

// Disable static generation — the auth gate must run on every request.
export const dynamic = "force-dynamic";

/** Best-effort first name from the Supabase user, fallback "Thomas". */
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
  return first || "Thomas";
}

/**
 * Drift guard (dev/server only). The client-safe tenant configs in
 * `lib/cohortInviteBuilder.ts` are hand-mirrored from the canonical builders
 * in `lib/demoTenantLinks.ts` (we can't import the Buffer-based canonical
 * module into the client bundle — see that file's header). This compares the
 * two encodings server-side and logs a warning if they ever drift, so a stale
 * mirror surfaces in build/dev logs instead of silently shipping wrong configs.
 */
function assertTenantConfigParity(): void {
  const canonical: Record<string, string> = {
    unc: buildClinicalEngineLink(uncMedicalCenterConfig()),
    duke: buildClinicalEngineLink(dukeUniversityConfig()),
    ahn: buildClinicalEngineLink(alleghenyHealthNetworkConfig()),
  };
  for (const slug of Object.keys(canonical)) {
    const mirrored = `${CLINICAL_ENGINE_URL}#config=${encodeConfigHash(
      tenantConfigFor(slug),
    )}`;
    if (mirrored !== canonical[slug]) {
      console.warn(
        `[cohort-invite] tenant config DRIFT for "${slug}": the mirror in ` +
          `lib/cohortInviteBuilder.ts no longer matches lib/demoTenantLinks.ts. ` +
          `Re-sync the mirrored config.`,
      );
    }
  }
}

export default async function CohortInvitePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Gate 1 — anonymous.
  if (!user) redirect("/login?next=/cohort-invite");

  // Gate 2 — authenticated but not allow-listed. Redirect to the marketing
  // root rather than a 403 so we don't disclose the builder's existence.
  if (!isDemoHubAllowed(user.email)) redirect("/");

  // Gate 3 — allow-listed: render. Run the drift guard first (no-op in prod
  // unless a mirror has gone stale).
  assertTenantConfigParity();

  const defaultSender = senderFirstName(user);

  return (
    <main className="min-h-screen bg-cream-light">
      <div className="container py-16 md:py-24">
        <p className="label">Internal · Demo hub · Cohort invites</p>
        <h1 className="mt-3 max-w-3xl font-display text-4xl leading-[1.05] text-ink md:text-6xl">
          Build a cohort invite.
        </h1>
        <p className="mt-6 max-w-prose text-lg leading-relaxed text-ink-2">
          Pick the tenant, enter a tester&apos;s details, and copy a personalized
          no-login link plus a ready-to-send email. The link carries the
          tenant&apos;s branding in the URL hash and pre-fills the tester&apos;s
          info so the engine boots straight into the cohort flow.
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
            Generated links carry the tenant config in the URL hash and open
            without sign-in. Access to this builder is restricted to ateninc.com
            staff and a small invite list. To add a new invitee, see CLAUDE.md.
          </p>
        </div>
      </div>
    </main>
  );
}
