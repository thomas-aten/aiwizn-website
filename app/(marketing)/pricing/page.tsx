import type { Metadata } from "next";
import { ACTIVE_PRICE, ACTIVE_TIER, ENGINES_INCLUDED, PRICE_TIERS } from "@/lib/pricing";
import { SubscribeButton } from "@/components/pricing/subscribe-button";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Get full access to the AIWIZN Clinical Engine and JC 2026 Engine — annual subscription, cancel anytime.",
};

export default function PricingPage() {
  const isEarlyBird = ACTIVE_TIER === "early_bird";
  const regular = PRICE_TIERS.regular;

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
            stealth assessment, and Joint Commission 2026 readiness — backed by
            21 years of evidence-anchored simulation work.
          </p>
        </div>
      </section>

      <section>
        <div className="container py-10 md:py-16">
          <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_360px] md:gap-12">
            <div className="card p-8 md:p-10">
              <p className="label">Includes</p>
              <h2 className="mt-3 font-display text-2xl text-ink md:text-3xl">
                Two engines, one subscription.
              </h2>
              <ul className="mt-6 space-y-4">
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
                <ul className="mt-3 grid gap-2 text-sm text-ink-2 sm:grid-cols-2">
                  <li>• Unlimited scenario runs</li>
                  <li>• Stealth competency analytics</li>
                  <li>• Joint Commission 2026 mapping</li>
                  <li>• Adaptive Goldilocks calibration</li>
                  <li>• Formative feedback (RESONANCE)</li>
                  <li>• Lifecycle re-assessment (CONTINUUM)</li>
                </ul>
              </div>
            </div>

            <aside className="card relative overflow-hidden border-teal/30 bg-gradient-to-br from-white via-white to-teal/5 p-8 md:p-10">
              {isEarlyBird && (
                <span className="absolute right-6 top-6 rounded-full bg-orange/10 px-3 py-1 font-mono text-[10px] uppercase tracking-label text-orange">
                  Early bird
                </span>
              )}
              <p className="label">{ACTIVE_PRICE.label}</p>
              <p className="mt-3 flex items-baseline gap-2">
                <span className="font-display text-5xl text-ink">
                  {ACTIVE_PRICE.display}
                </span>
                <span className="font-mono text-xs uppercase tracking-label text-ink-3">
                  / {ACTIVE_PRICE.cadence}
                </span>
              </p>
              {isEarlyBird && (
                <p className="mt-2 font-mono text-[11px] uppercase tracking-label text-ink-3">
                  Standard rate {regular.display} / {regular.cadence}
                </p>
              )}
              <p className="mt-4 text-sm leading-relaxed text-ink-2">
                {ACTIVE_PRICE.note}
              </p>

              <SubscribeButton tier={ACTIVE_TIER} className="mt-6 w-full" />

              <p className="mt-4 text-center font-mono text-[10px] uppercase tracking-label text-ink-3">
                Secure checkout · Powered by Stripe
              </p>
              <p className="mt-2 text-center text-xs text-ink-3">
                You&apos;ll be asked to sign in or create an AIWIZN account first.
              </p>
            </aside>
          </div>
        </div>
      </section>

      <section>
        <div className="container pb-24">
          <div className="grid gap-6 md:grid-cols-3">
            <Faq
              q="Can I cancel anytime?"
              a="Yes. Cancel from the customer portal — your access continues to the end of the paid period."
            />
            <Faq
              q="Who is this for?"
              a="Hospital educators, nursing schools, simulation directors, and clinicians preparing for JC 2026 or onboarding redesign."
            />
            <Faq
              q="Will the price increase?"
              a={`Early-bird pricing is ${PRICE_TIERS.early_bird.display} / yr. Standard pricing is ${PRICE_TIERS.regular.display} / yr. Subscribers locked in at early-bird keep that rate at renewal.`}
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
