import { createClient } from "@/lib/supabase/server";
import { AGENTS, STAGES } from "@/lib/agents";

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

      <section className="mt-12">
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
