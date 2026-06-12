import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AGENTS, STAGES } from "@/lib/agents";
import { hasActiveEnginesSubscription } from "@/lib/entitlement";
import { ACTIVE_TIER, PLANS } from "@/lib/pricing";
import { getCustomerContext } from "@/lib/customerContext";
import {
  migrateToV11,
  type ProtocolConfigV11,
} from "@/lib/protocolConfig";
import { countPendingProposals } from "@/lib/clinicalOverrideProposals";

export const metadata = {
  title: "Workspace",
  robots: { index: false, follow: false },
};

/**
 * Load the active customer's most-recent protocol_configs row and coerce it to
 * the complete v1.1 shape. Mirrors `loadCurrentConfig` in /admin/config so the
 * dashboard "config-at-a-glance" card renders the same numbers the editor does.
 *
 * Defensive: a missing table / missing row / non-clinical-engine slug filter
 * never throws — we fall back to the canonical default so the banner still
 * shows something useful for a freshly-provisioned tenant.
 */
async function loadActiveCustomerConfig(
  supabase: ReturnType<typeof createClient>,
  customerId: string,
): Promise<{
  config: ProtocolConfigV11;
  slug: string;
  customerName: string;
}> {
  let slug = "your-hospital";
  let customerName = "Your Hospital";
  const { data: customer } = await supabase
    .from("customers")
    .select("slug, name")
    .eq("id", customerId)
    .maybeSingle();
  if (customer) {
    slug = (customer.slug as string) ?? slug;
    customerName = (customer.name as string) ?? customerName;
  }

  const { data: row, error } = await supabase
    .from("protocol_configs")
    .select("config_json")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.warn(
      "[dashboard] protocol_configs unavailable:",
      error.message,
    );
  }

  const config = migrateToV11(row?.config_json, slug, customerName);
  return { config, slug, customerName };
}

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const fullName =
    (user?.user_metadata?.full_name as string | undefined) ?? user?.email ?? "";

  const [entitled, ctx] = await Promise.all([
    hasActiveEnginesSubscription(),
    getCustomerContext(),
  ]);

  // The workspace-identity banner is only meaningful when the user is attached
  // to a customer. Anonymous / unassigned users fall back to the original
  // welcome (auth gating happens upstream — this is the visual backstop).
  //
  // Load identity-bound data in parallel so the page renders in one round-trip.
  const [identity, pendingReviews] =
    ctx.status === "ok"
      ? await Promise.all([
          loadActiveCustomerConfig(supabase, ctx.activeCustomerId),
          ctx.canEdit
            ? countPendingProposals(ctx.activeCustomerId)
            : Promise.resolve(0),
        ])
      : [null, 0];

  return (
    <>
      {ctx.status === "ok" && identity ? (
        <>
          {/* --- Workspace identity banner --------------------------------- */}
          <p className="label">Workspace</p>
          <div className="mt-3 flex items-center gap-6 rounded-2xl border border-ink/10 bg-white p-6">
            <span
              aria-hidden
              className="h-12 w-1.5 shrink-0 rounded-full"
              style={{ background: identity.config.branding.accent_color }}
            />
            <div className="min-w-0">
              <p className="font-mono text-[10px] uppercase tracking-label text-ink-3">
                Active workspace
              </p>
              <h1 className="mt-1 truncate font-display text-3xl text-ink md:text-4xl">
                {identity.config.branding.hospital_name_display ||
                  identity.customerName}
              </h1>
              <p className="mt-1 truncate text-sm text-ink-2">
                {identity.customerName} · slug{" "}
                <code className="font-mono text-xs">{identity.slug}</code> ·{" "}
                {ctx.role}
              </p>
            </div>
          </div>

          {/* --- Config-at-a-glance ---------------------------------------- */}
          <section className="mt-8">
            <p className="font-mono text-[10px] uppercase tracking-label text-ink-3">
              Config at a glance
            </p>
            <div className="mt-3 grid gap-px overflow-hidden rounded-2xl border border-ink/10 bg-ink/10 md:grid-cols-2 lg:grid-cols-5">
              <div className="bg-white p-5">
                <p className="font-mono text-[10px] uppercase tracking-label text-ink-3">
                  Door-to-balloon (PCI)
                </p>
                <p className="mt-2 font-display text-2xl text-ink">
                  {identity.config.timings.stemi_door_to_balloon_min}{" "}
                  <span className="text-base text-ink-2">min</span>
                </p>
                <p className="mt-2 text-[11px] leading-snug text-ink-3">
                  AHA gold standard ≤90
                </p>
              </div>
              <div className="bg-white p-5">
                <p className="font-mono text-[10px] uppercase tracking-label text-ink-3">
                  Door-to-needle (Stroke)
                </p>
                <p className="mt-2 font-display text-2xl text-ink">
                  {identity.config.timings.stroke_door_to_needle_min}{" "}
                  <span className="text-base text-ink-2">min</span>
                </p>
                <p className="mt-2 text-[11px] leading-snug text-ink-3">
                  AHA/ASA target ≤45
                </p>
              </div>
              <div className="bg-white p-5">
                <p className="font-mono text-[10px] uppercase tracking-label text-ink-3">
                  Sepsis bundle
                </p>
                <p className="mt-2 font-display text-2xl text-ink">
                  {identity.config.timings.sepsis_bundle_hr}{" "}
                  <span className="text-base text-ink-2">hr</span>
                </p>
                <p className="mt-2 text-[11px] leading-snug text-ink-3">
                  SSC 1-hr or 3-hr
                </p>
              </div>
              <div className="bg-white p-5">
                <p className="font-mono text-[10px] uppercase tracking-label text-ink-3">
                  Interpreter service
                </p>
                <p
                  className="mt-2 font-display text-xl leading-tight text-ink"
                  title={identity.config.terminology.interpreter_service}
                >
                  {identity.config.terminology.interpreter_service}
                </p>
              </div>
              <div className="bg-white p-5">
                <p className="font-mono text-[10px] uppercase tracking-label text-ink-3">
                  Attending naming
                </p>
                <p className="mt-2 font-display text-xl leading-tight text-ink capitalize">
                  {identity.config.branding.attending_naming}
                </p>
              </div>
            </div>
          </section>

          {/* --- Quick links / non-admin tile ----------------------------- */}
          {ctx.canEdit ? (
            <section className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                href="/dashboard/admin/config"
                className="btn-ghost border border-ink/10 hover:border-ink/30"
              >
                Edit config →
              </Link>
              <Link
                href="/dashboard/admin/reviews"
                className="btn-ghost border border-ink/10 hover:border-ink/30"
              >
                Review queue ({pendingReviews}) →
              </Link>
              <Link
                href="/dashboard/engines/clinical"
                className="btn-ghost border border-ink/10 hover:border-ink/30"
              >
                Launch engine →
              </Link>
            </section>
          ) : (
            <section className="card mt-6 p-5">
              <p className="font-mono text-[10px] uppercase tracking-label text-ink-3">
                How to use this workspace
              </p>
              <p className="mt-2 text-sm leading-relaxed text-ink-2">
                You&rsquo;re signed in as{" "}
                <code className="font-mono text-xs">{ctx.role}</code> for{" "}
                {identity.customerName}. Open the engines below to run scenarios
                tuned to this hospital&rsquo;s protocol — timing targets,
                terminology, and attending naming all reflect the configuration
                above.
              </p>
            </section>
          )}
        </>
      ) : (
        <>
          <p className="label">Workspace</p>
          <h1 className="mt-2 font-display text-4xl text-ink md:text-5xl">
            Welcome, {fullName.split(" ")[0] || "clinician"}.
          </h1>
          <p className="mt-3 max-w-prose text-ink-2">
            This is your AIWIZN command surface. Pre-launch — the live agents
            below will activate as the platform graduates from architecture to
            operating product.
          </p>
        </>
      )}

      {entitled ? (
        <Link
          href="/dashboard/engines"
          className="card mt-10 block overflow-hidden border-teal/30 bg-gradient-to-br from-white via-white to-teal/5 p-8 transition hover:border-teal/60 hover:shadow-md md:p-10"
        >
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="max-w-2xl">
              <p className="font-mono text-[10px] uppercase tracking-label text-teal-dark">
                ● Subscription active · Both engines unlocked
              </p>
              <h2 className="mt-3 font-display text-2xl leading-tight text-ink md:text-3xl">
                Launch the AIWIZN Engines →
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-ink-2">
                Run scenarios through the Clinical Engine or the JC 2026 Engine.
              </p>
            </div>
            <span className="btn-primary">Open engines</span>
          </div>
        </Link>
      ) : (
        <div className="card mt-10 overflow-hidden border-orange/30 bg-gradient-to-br from-white via-white to-orange/5 p-8 md:p-10">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="max-w-2xl">
              <p className="font-mono text-[10px] uppercase tracking-label text-orange">
                ● No active subscription
              </p>
              <h2 className="mt-3 font-display text-2xl leading-tight text-ink md:text-3xl">
                Unlock both engines for {PLANS.individual.prices[ACTIVE_TIER].display} / yr.
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-ink-2">
                Annual subscription · Clinical Engine + JC 2026 Engine ·
                Cancel anytime.
              </p>
            </div>
            <Link href="/pricing" className="btn-primary">
              See pricing
            </Link>
          </div>
        </div>
      )}

      <section className="mt-14">
        <h2 className="font-display text-2xl text-ink">The flywheel, today</h2>
        <div className="mt-5 grid gap-px overflow-hidden rounded-2xl border border-ink/10 bg-ink/10 md:grid-cols-2 lg:grid-cols-4">
          {STAGES.map((s, i) => (
            <div key={s.id} className="bg-cream-light p-6">
              <p className="font-mono text-[10px] uppercase tracking-label text-ink-3">
                Stage 0{i + 1}
              </p>
              <h3 className="mt-2 font-display text-xl text-ink">{s.title}</h3>
              <p className="mt-1 text-xs text-ink-2">{s.tagline}</p>
              <p className="mt-4 font-mono text-[10px] uppercase tracking-label text-ink-3">
                Status · In build
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-14">
        <h2 className="font-display text-2xl text-ink">Agents</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {AGENTS.map((a) => (
            <article key={a.id} className="card p-5">
              <p className="font-mono text-[10px] uppercase tracking-label text-ink-3">
                {a.role}
              </p>
              <h3 className="mt-2 font-display text-xl text-ink">{a.name}</h3>
              <p className="mt-2 text-sm text-ink-2">{a.description}</p>
              <p className="mt-4 font-mono text-[10px] uppercase tracking-label text-teal-dark">
                ● Pre-launch
              </p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
