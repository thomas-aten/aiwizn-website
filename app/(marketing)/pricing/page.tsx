import type { Metadata } from "next";
import {
  ACTIVE_TIER,
  ENGINES_INCLUDED,
  PLANS,
} from "@/lib/pricing";
import { SubscribeButton } from "@/components/pricing/subscribe-button";
import { InstitutionalCard } from "@/components/pricing/institutional-card";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Get full access to the AIWIZN Clinical Engine and JC 2026 Engine — annual subscription, individual or institutional seat licenses.",
};

export default function PricingPage() {
  const isEarlyBird = ACTIVE_TIER === "early_bird";
  const individual = PLANS.individual.prices[ACTIVE_TIER];
  const individualRegular = PLANS.individual.prices.regular;

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
                <li>• Joint Commission 2026 mapping</li>
                <li>• Adaptive Goldilocks calibration</li>
                <li>• Formative feedback (RESONANCE)</li>
                <li>• Lifecycle re-assessment (CONTINUUM)</li>
              </ul>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <aside className="card relative overflow-hidden border-teal/30 bg-gradient-to-br from-white via-white to-teal/5 p-8 md:p-10">
              {isEarlyBird && (
                <span className="absolute right-6 top-6 rounded-full bg-orange/10 px-3 py-1 font-mono text-[10px] uppercase tracking-label text-orange">
                  Early bird
                </span>
              )}
              <p className="label">{PLANS.individual.name}</p>
              <p className="mt-2 max-w-prose text-sm leading-relaxed text-ink-2">
                {PLANS.individual.audience}
              </p>
              <p className="mt-5 flex items-baseline gap-2">
                <span className="font-display text-5xl text-ink">
                  {individual.display}
                </span>
                <span className="font-mono text-xs uppercase tracking-label text-ink-3">
                  / {individual.cadence}
                </span>
              </p>
              {isEarlyBird && (
                <p className="mt-2 font-mono text-[11px] uppercase tracking-label text-ink-3">
                  Standard rate {individualRegular.display} /{" "}
                  {individualRegular.cadence}
                </p>
              )}
              <p className="mt-4 text-sm leading-relaxed text-ink-2">
                {individual.note}
              </p>

              <SubscribeButton
                plan="individual"
                tier={ACTIVE_TIER}
                className="mt-6 w-full"
              />
              <p className="mt-4 text-center font-mono text-[10px] uppercase tracking-label text-ink-3">
                Secure checkout · Powered by Stripe
              </p>
              <p className="mt-2 text-center text-xs text-ink-3">
                You&apos;ll be asked to sign in or create an AIWIZN account first.
              </p>
            </aside>

            <InstitutionalCard />
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
              q="How does institutional billing work?"
              a={`Hospitals and schools pay $${PLANS.institutional.prices.early_bird.amount} per nurse per year (early bird) or $${PLANS.institutional.prices.regular.amount} standard. Self-serve checkout supports up to 100 nurses. For 100+ nurses, email Thomas@ateninc.com for volume pricing and invoiced billing.`}
            />
            <Faq
              q="Will the price increase?"
              a="Early-bird rates are locked in at renewal for both individual and institutional subscribers who sign up during the launch window."
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
