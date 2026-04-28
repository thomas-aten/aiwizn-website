import type { Metadata } from "next";
import Link from "next/link";
import { CTA } from "@/components/sections/cta";

export const metadata: Metadata = {
  title: "For Schools",
  description:
    "AIWIZN for nursing schools — NCLEX-NGN aligned scenario practice, clinical judgement development, and competency analytics for faculty.",
};

const POINTS = [
  {
    title: "NCLEX-NGN aligned",
    body: "Scenarios mapped to the Clinical Judgment Measurement Model and current NGN item types.",
  },
  {
    title: "Clinical judgement, made visible",
    body: "Faculty see exactly where students are stuck — recognition, prioritisation, escalation, communication — and why.",
  },
  {
    title: "Authoring on your terms",
    body: "PRAXIS and NARRATIVE turn your existing curriculum and case files into immersive practice without a production team.",
  },
  {
    title: "Cohort analytics",
    body: "LUMINA aggregates competency growth at the cohort, programme, and school level.",
  },
];

export default function ForSchoolsPage() {
  return (
    <>
      <section>
        <div className="container pt-20 pb-8 md:pt-28">
          <p className="label">For Schools</p>
          <h1 className="mt-4 max-w-4xl font-display text-4xl leading-[1.05] text-ink md:text-6xl">
            Modern clinical judgement, <br className="hidden md:block" />
            measured on every action.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-2">
            Built on evidence-centered design and Bayesian knowledge networks —
            the gold standard in psychometric science — AIWIZN gives nursing
            schools a way to develop, observe, and certify clinical judgement
            without artificial testing.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/contact" className="btn-primary">
              Bring AIWIZN to your programme
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
