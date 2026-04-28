import type { Metadata } from "next";
import Link from "next/link";
import { CTA } from "@/components/sections/cta";

export const metadata: Metadata = {
  title: "For Hospitals",
  description:
    "Replace slide decks and shadowing with immersive scenario-driven onboarding. Reduce first-year turnover and time-to-competency, with auditable outcome data.",
};

const POINTS = [
  {
    title: "Scenario-driven onboarding",
    body: "Replace slide decks, shadowing, and annual compliance modules with immersive clinical scenarios authored from your own SOPs.",
  },
  {
    title: "Stealth competency data",
    body: "COGNITA infers proficiency invisibly from every action — no explicit testing, no test-anxiety bias, audit-ready evidence.",
  },
  {
    title: "Lifecycle, not one-and-done",
    body: "CONTINUUM keeps competency current beyond orientation: re-assessing, re-coaching, and re-certifying across the full nursing lifecycle.",
  },
  {
    title: "Outcomes you can defend",
    body: "Kirkpatrick L1–L3 dashboards and exportable evidence packs for educators, CNOs, and accreditation reviewers.",
  },
];

export default function ForHospitalsPage() {
  return (
    <>
      <section>
        <div className="container pt-20 pb-8 md:pt-28">
          <p className="label">For Hospitals</p>
          <h1 className="mt-4 max-w-4xl font-display text-4xl leading-[1.05] text-ink md:text-6xl">
            Replace outdated onboarding. <br className="hidden md:block" />
            Keep the nurses you hire.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-2">
            Inadequate onboarding is cited in 35% of first-year departures.
            AIWIZN measurably reduces clinical errors, turnover, and
            time-to-competency — with the rigour the profession demands.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/contact" className="btn-primary">
              Talk to us about a pilot
            </Link>
            <Link href="/platform" className="btn-secondary">
              See the platform
            </Link>
          </div>
        </div>
      </section>

      <section>
        <div className="container py-16 md:py-24">
          <div className="grid gap-5 md:grid-cols-2">
            {POINTS.map((p) => (
              <article key={p.title} className="card p-7">
                <h3 className="font-display text-2xl text-ink">{p.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-ink-2">{p.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <CTA />
    </>
  );
}
