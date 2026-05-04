import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AGENTS, STAGES } from "@/lib/agents";
import { hasActiveEnginesSubscription } from "@/lib/entitlement";
import { ACTIVE_PRICE } from "@/lib/pricing";

export const metadata = {
  title: "Workspace",
  robots: { index: false, follow: false },
};

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const fullName =
    (user?.user_metadata?.full_name as string | undefined) ?? user?.email ?? "";

  const entitled = await hasActiveEnginesSubscription();

  return (
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
                Unlock both engines for {ACTIVE_PRICE.display} / yr.
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
