import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Investors",
  description:
    "$2.0M Seed · 18-month runway to Series A. Request the full AIWIZN data room.",
};

const HIGHLIGHTS = [
  { stat: "$8.4B", label: "U.S. workforce training market (2025)" },
  { stat: "$2.1B", label: "Nursing-specific segment, 11.4% CAGR" },
  { stat: "6,000+", label: "U.S. hospitals each spending $200K–$2M / yr" },
  { stat: "280+", label: "Nursing schools as a parallel buyer" },
];

export default function InvestorsPage() {
  return (
    <>
      <section>
        <div className="container pt-20 pb-8 md:pt-28">
          <p className="label">Investors</p>
          <h1 className="mt-4 max-w-4xl font-display text-4xl leading-[1.05] text-ink md:text-6xl">
            $2.0M Seed · 18-month runway to Series A.
          </h1>
          <p className="mt-6 max-w-prose text-lg leading-relaxed text-ink-2">
            A large, underserved market with no real incumbent. HealthStream is
            compliance-video software — no simulation, no adaptive learning, no
            psychometrics. Fundamentally a different category.
          </p>
        </div>
      </section>

      <section>
        <div className="container py-16 md:py-20">
          <div className="grid gap-px overflow-hidden rounded-2xl border border-ink/10 bg-ink/10 md:grid-cols-2 lg:grid-cols-4">
            {HIGHLIGHTS.map((h) => (
              <div key={h.label} className="bg-cream-light p-8">
                <div className="font-display text-3xl text-ink md:text-4xl">{h.stat}</div>
                <div className="mt-3 max-w-[24ch] text-sm leading-snug text-ink-2">{h.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="container pb-24">
          <div className="card p-10 md:p-14">
            <p className="label">Data room</p>
            <h2 className="mt-3 max-w-3xl font-display text-3xl leading-tight text-ink md:text-5xl">
              Request the full AIWIZN data room.
            </h2>
            <p className="mt-5 max-w-prose text-base leading-relaxed text-ink-2">
              Includes the full architecture document, scenario storyboard demo,
              budget model, clinical advisory bios, and the psychometric
              validation plan.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="mailto:Thomas@ateninc.com?subject=AIWIZN%20%E2%80%94%20Request%20the%20full%20investor%20data%20room"
                className="btn-primary"
              >
                Request the data room
              </a>
              <a
                href="https://thomas-aten.github.io/aiwizn-investor-brief/"
                className="btn-secondary"
                target="_blank"
                rel="noopener noreferrer"
              >
                Read the public brief →
              </a>
            </div>
            <p className="mt-8 font-mono text-[11px] uppercase tracking-label text-ink-3">
              Private &amp; confidential · Not for distribution without prior written consent
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
