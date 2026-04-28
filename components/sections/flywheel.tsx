import { STAGES } from "@/lib/agents";

const STAGE_DETAIL: Record<
  (typeof STAGES)[number]["id"],
  { headline: string; body: string }
> = {
  learn: {
    headline: "SOP → Scenario.",
    body: "Clinical policies transformed into rich, animated scenario introductions. No slide decks. Narrative-first, evidence-grounded.",
  },
  practice: {
    headline: "Simulate & Fail Safely.",
    body: "Dynamic patient state machine. Goldilocks difficulty calibration. Fail-forward mechanics — the patient deteriorates on wrong choices. Rescue required.",
  },
  assess: {
    headline: "Stealth Intelligence.",
    body: "No explicit testing. Competency inferred invisibly from every simulation action via Bayesian knowledge networks — the gold standard in psychometric science.",
  },
  relearn: {
    headline: "Reinforce & Advance.",
    body: "Instant formative feedback. Spaced repetition scheduling. Expert nurse performance back-harvested to seed better scenarios. The system gets smarter with every nurse it trains.",
  },
};

const ACCENT: Record<string, string> = {
  teal: "before:bg-teal",
  orange: "before:bg-orange",
  gold: "before:bg-gold",
  purple: "before:bg-purple",
};

export function Flywheel() {
  return (
    <section className="bg-ink text-cream-light">
      <div className="container py-20 md:py-28">
        <p className="font-mono text-[11px] uppercase tracking-label text-cream-light/60">
          The Solution
        </p>
        <h2 className="mt-4 max-w-4xl font-display text-3xl leading-tight md:text-5xl">
          A virtuous learning flywheel — four stages.
        </h2>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-cream-light/70">
          Every design decision is evidence-anchored. Each stage feeds the next
          and the next refines the first.
        </p>

        <ol className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-cream-light/10 bg-cream-light/10 md:grid-cols-2 lg:grid-cols-4">
          {STAGES.map((stage, idx) => {
            const detail = STAGE_DETAIL[stage.id];
            return (
              <li
                key={stage.id}
                className={`relative bg-ink p-8 before:absolute before:left-0 before:top-0 before:h-full before:w-1 ${ACCENT[stage.accent]}`}
              >
                <div className="font-mono text-[11px] uppercase tracking-label text-cream-light/50">
                  Stage 0{idx + 1} · {stage.title}
                </div>
                <h3 className="mt-3 font-display text-2xl text-cream-light md:text-3xl">
                  {detail.headline}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-cream-light/75">
                  {detail.body}
                </p>
                <p className="mt-5 font-mono text-[11px] uppercase tracking-label text-cream-light/40">
                  {stage.tagline}
                </p>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
