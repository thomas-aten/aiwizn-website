import Link from "next/link";
import { PLANS } from "@/lib/pricing";

/**
 * Institutional plan card.
 *
 * Pricing is provided on request — the prior per-seat calculator has been
 * replaced with a Contact us / Request Pricing CTA. The plan framing,
 * audience, and value bullets stay so prospects understand the offer.
 */
export function InstitutionalCard() {
  const plan = PLANS.institutional;

  return (
    <aside className="card relative overflow-hidden border-gold/30 bg-gradient-to-br from-white via-white to-gold/5 p-8 md:p-10">
      <p className="label">{plan.name}</p>
      <p className="mt-2 max-w-prose text-sm leading-relaxed text-ink-2">
        {plan.audience}
      </p>

      <p className="mt-5 font-display text-4xl text-ink md:text-5xl">
        Request Pricing
      </p>
      <p className="mt-4 text-sm leading-relaxed text-ink-2">
        Annual seat licenses for hospitals, health systems, and nursing
        schools. Pricing scales with cohort size — we&apos;ll send a quote
        tailored to your team.
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

      <p className="mt-4 text-center font-mono text-[10px] uppercase tracking-label text-ink-3">
        Email{" "}
        <a
          className="hover:text-ink"
          href="mailto:Thomas@ateninc.com?subject=AIWIZN%20%E2%80%94%20Institutional%20Pricing"
        >
          Thomas@ateninc.com
        </a>{" "}
        for a quote
      </p>
    </aside>
  );
}
