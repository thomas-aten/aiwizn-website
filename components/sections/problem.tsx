export function Problem() {
  return (
    <section className="relative">
      <div className="container py-20 md:py-28">
        <p className="label">The Problem</p>
        <h2 className="mt-4 max-w-4xl font-display text-3xl leading-tight text-ink md:text-5xl">
          Healthcare&apos;s most expensive unsolved problem.
        </h2>

        <div className="mt-10 grid gap-8 md:grid-cols-2 md:gap-14">
          <p className="max-w-prose text-lg leading-relaxed text-ink-2">
            Inadequate onboarding is cited in roughly a third of first-year RN
            departures — yet most hospitals still rely on slide decks,
            shadowing, and annual compliance modules. The nursing workforce
            crisis is not a supply problem.
          </p>
          <p className="max-w-prose text-lg leading-relaxed text-ink-2">
            It is a retention and competency development problem — and no
            platform has meaningfully addressed it with the rigor the
            profession demands.
          </p>
        </div>

        <div className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-ink/10 bg-ink/10 md:grid-cols-2 lg:grid-cols-4">
          <Cell
            stat="≈ 35%"
            label="First-year RN departures linked to weak orientation (NSI 2026)"
            tone="teal"
          />
          <Cell
            stat="≈ $60K"
            label="Replacement cost per first-year RN turnover (NSI 2026 — ≈ $60,090)"
            tone="orange"
          />
          <Cell
            stat="> 30%"
            label="First-year RN turnover, national average (NSI 2026)"
            tone="gold"
          />
          <Cell
            stat="1:1"
            label="Best-practice preceptor ratio — ratios often exceed it on understaffed units"
            tone="purple"
          />
        </div>
        <p className="mt-6 max-w-3xl font-mono text-[10px] uppercase leading-snug tracking-label text-ink-3">
          Source — NSI Vizient <i>2026 National Health Care Retention &amp; RN Staffing Report</i> (2025 data; first-year RN turnover &gt; 30%; per-turnover cost ≈ $60,090). Overall RN turnover ≈ 17%; first-year is the load-bearing figure for onboarding ROI.
        </p>
      </div>
    </section>
  );
}

function Cell({
  stat,
  label,
  tone,
}: {
  stat: string;
  label: string;
  tone: "teal" | "orange" | "gold" | "purple";
}) {
  const ring = {
    teal: "before:bg-teal",
    orange: "before:bg-orange",
    gold: "before:bg-gold",
    purple: "before:bg-purple",
  }[tone];

  return (
    <div
      className={`relative bg-cream-light p-8 before:absolute before:left-0 before:top-0 before:h-full before:w-1 ${ring}`}
    >
      <div className="font-display text-3xl text-ink md:text-4xl">{stat}</div>
      <div className="mt-3 max-w-[24ch] text-sm leading-snug text-ink-2">
        {label}
      </div>
    </div>
  );
}
