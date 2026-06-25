import type { Metadata } from "next";
import Link from "next/link";
import { ENGINES_INCLUDED, PLANS } from "@/lib/pricing";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Get full access to the AIWIZN Clinical Engine and JC 2026 Engine — annual subscription, individual or institutional seat licenses. Request pricing tailored to your team.",
};

export default function PricingPage() {
  return (
    <>
      <section>
        <div className="container pt-20 pb-8 md:pt-28">
          <p className="label">Pricing · Annual subscription</p>
          <h1 className="mt-4 max-w-4xl font-display text-4xl leading-[1.05] text-ink md:text-6xl">
            Full access to AIWIZN&apos;s Clinical Engines.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-2">
            One subscription, both engines. Adaptive scenario practice,
            stealth assessment, and preparation for Joint Commission 2026
            standards (including RUAIH) — backed by 21 years of
            evidence-anchored simulation work.
          </p>
          <p className="mt-3 max-w-2xl text-xs leading-relaxed text-ink-3">
            AIWIZN prepares organizations and people for AI-readiness and
            accreditation standards including Joint Commission RUAIH. AIWIZN
            does not confer, certify, issue, or substitute for Joint Commission
            certification — only the Joint Commission can issue RUAIH.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/contact" className="btn-primary">
              Request Pricing
            </Link>
            <a
              href="mailto:Thomas@ateninc.com?subject=AIWIZN%20%E2%80%94%20Request%20Pricing"
              className="btn-secondary"
            >
              Email Thomas@ateninc.com
            </a>
          </div>
        </div>
      </section>

      <section>
        <div className="container py-10 md:py-16">
          <div className="card mb-10 p-8 md:p-10">
            <p className="label">Both plans include</p>
            <h2 className="mt-3 font-display text-2xl text-ink md:text-3xl">
              Two engines, one subscription.
            </h2>
            <ul className="mt-6 grid gap-4 md:grid-cols-2">
              {ENGINES_INCLUDED.map((e) => (
                <li key={e.title} className="flex items-start gap-3">
                  <span
                    aria-hidden
                    className="mt-1.5 inline-block h-2.5 w-2.5 rounded-full bg-teal-dark"
                  />
                  <div>
                    <p className="font-display text-lg text-ink">{e.title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-ink-2">
                      {e.blurb}
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="hr-soft mt-8 pt-6">
              <p className="font-mono text-[11px] uppercase tracking-label text-ink-3">
                What&apos;s included
              </p>
              <ul className="mt-3 grid gap-2 text-sm text-ink-2 sm:grid-cols-2 lg:grid-cols-3">
                <li>• Unlimited scenario runs</li>
                <li>• Stealth competency analytics</li>
                <li>• Joint Commission 2026 / RUAIH readiness preparation</li>
                <li>• Adaptive Goldilocks calibration</li>
                <li>• Formative feedback (RESONANCE)</li>
                <li>• Lifecycle re-assessment (CONTINUUM)</li>
              </ul>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <aside className="card relative overflow-hidden border-teal/30 bg-gradient-to-br from-white via-white to-teal/5 p-8 md:p-10">
              <p className="label">{PLANS.individual.name}</p>
              <p className="mt-2 max-w-prose text-sm leading-relaxed text-ink-2">
                {PLANS.individual.audience}
              </p>
              <p className="mt-5 font-display text-4xl text-ink">
                Request Pricing
              </p>
              <p className="mt-4 text-sm leading-relaxed text-ink-2">
                Annual subscription. Cancel anytime. Tailored pricing for
                clinicians, faculty, and self-paced learners — talk to us
                about what fits your situation.
              </p>

              <Link
                href="/contact"
                className="btn-primary mt-6 inline-flex w-full justify-center"
              >
                Contact us
              </Link>
              <p className="mt-4 text-center text-xs text-ink-3">
                Email{" "}
                <a
                  className="hover:text-ink"
                  href="mailto:Thomas@ateninc.com?subject=AIWIZN%20%E2%80%94%20Individual%20Pricing"
                >
                  Thomas@ateninc.com
                </a>{" "}
                or use the contact form.
              </p>
            </aside>

            <aside className="card relative overflow-hidden border-gold/30 bg-gradient-to-br from-white via-white to-gold/5 p-8 md:p-10">
              <p className="label">{PLANS.institutional.name}</p>
              <p className="mt-2 max-w-prose text-sm leading-relaxed text-ink-2">
                For hospitals, health systems, and nursing schools. Volume
                pricing and invoiced billing available.
              </p>
              <p className="mt-5 font-display text-4xl text-ink">
                Request Pricing
              </p>
              <p className="mt-4 text-sm leading-relaxed text-ink-2">
                Annual seat licenses for hospitals and schools. Pricing scales
                with cohort size — get a quote tailored to your team.
              </p>

              <ul className="mt-5 space-y-2 text-sm text-ink-2">
                <li>• Volume pricing for any cohort size</li>
                <li>• Invoiced billing &amp; multi-year terms available</li>
                <li>• Dedicated onboarding &amp; clinical advisory support</li>
              </ul>

              <Link
                href="/contact"
                className="btn-primary mt-6 inline-flex w-full justify-center"
              >
                Contact us
              </Link>
              <p className="mt-4 text-center text-xs text-ink-3">
                Email{" "}
                <a
                  className="hover:text-ink"
                  href="mailto:Thomas@ateninc.com?subject=AIWIZN%20%E2%80%94%20Institutional%20Pricing"
                >
                  Thomas@ateninc.com
                </a>{" "}
                with your cohort size for a quote.
              </p>
            </aside>
          </div>
        </div>
      </section>

      <section>
        <div className="container pb-24">
          <div className="grid gap-6 md:grid-cols-3">
            <Faq
              q="How do I get pricing?"
              a="Reach out via the contact form or email Thomas@ateninc.com. We'll send pricing tailored to your situation — individual, school cohort, or hospital seat license."
            />
            <Faq
              q="How does institutional billing work?"
              a="Hospitals and schools are quoted on a per-nurse annual license basis with volume discounts. Invoiced billing and multi-year terms are available. Contact us for a quote."
            />
            <Faq
              q="Can I cancel anytime?"
              a="Yes. Annual subscriptions can be cancelled from the customer portal — access continues to the end of the paid period."
            />
          </div>
        </div>
      </section>
    </>
  );
}

function Faq({ q, a }: { q: string; a: string }) {
  return (
    <div className="card p-6">
      <p className="font-display text-lg text-ink">{q}</p>
      <p className="mt-2 text-sm leading-relaxed text-ink-2">{a}</p>
    </div>
  );
}
