"use client";

import { useState } from "react";
import { SubscribeButton } from "@/components/pricing/subscribe-button";
import {
  ACTIVE_TIER,
  DEFAULT_INSTITUTIONAL_SEATS,
  PLANS,
  SELF_SERVE_SEAT_CAP,
} from "@/lib/pricing";

const formatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

export function InstitutionalCard() {
  const plan = PLANS.institutional;
  const active = plan.prices[ACTIVE_TIER];
  const regular = plan.prices.regular;
  const isEarlyBird = ACTIVE_TIER === "early_bird";

  const [seats, setSeats] = useState<number>(DEFAULT_INSTITUTIONAL_SEATS);
  const overCap = seats > SELF_SERVE_SEAT_CAP;
  const total = active.amount * seats;

  function clampSeats(n: number) {
    if (!Number.isFinite(n)) return 1;
    return Math.max(1, Math.min(9999, Math.floor(n)));
  }

  return (
    <aside className="card relative overflow-hidden border-gold/30 bg-gradient-to-br from-white via-white to-gold/5 p-8 md:p-10">
      {isEarlyBird && (
        <span className="absolute right-6 top-6 rounded-full bg-orange/10 px-3 py-1 font-mono text-[10px] uppercase tracking-label text-orange">
          Early bird
        </span>
      )}
      <p className="label">{plan.name}</p>
      <p className="mt-2 max-w-prose text-sm leading-relaxed text-ink-2">
        {plan.audience}
      </p>

      <p className="mt-5 flex items-baseline gap-2">
        <span className="font-display text-4xl text-ink md:text-5xl">
          {active.display}
        </span>
        <span className="font-mono text-xs uppercase tracking-label text-ink-3">
          / {active.cadence}
        </span>
      </p>
      {isEarlyBird && (
        <p className="mt-2 font-mono text-[11px] uppercase tracking-label text-ink-3">
          Standard rate {regular.display} / {regular.cadence}
        </p>
      )}

      <p className="mt-4 text-sm leading-relaxed text-ink-2">{active.note}</p>

      <div className="hr-soft mt-6 pt-5">
        <label className="flex flex-wrap items-end gap-4">
          <span className="block">
            <span className="label">Number of nurses</span>
            <input
              type="number"
              min={1}
              max={9999}
              value={seats}
              onChange={(e) => setSeats(clampSeats(parseInt(e.target.value, 10)))}
              className="mt-2 w-28 rounded-lg border border-ink/15 bg-white px-3 py-2 font-display text-2xl text-ink focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30"
            />
          </span>
          <span className="block flex-1">
            <span className="label">Annual total</span>
            <span className="mt-2 block font-display text-3xl text-ink">
              {formatter.format(total)}
              <span className="ml-2 font-mono text-xs uppercase tracking-label text-ink-3">
                / yr
              </span>
            </span>
          </span>
        </label>
      </div>

      {overCap ? (
        <a
          href={`mailto:Thomas@ateninc.com?subject=AIWIZN%20Institutional%20%E2%80%94%20${seats}%20nurses&body=Hi%20Thomas%2C%0A%0AI'm%20interested%20in%20the%20institutional%20plan%20for%20${seats}%20nurses.%20Please%20share%20volume%20pricing%20and%20invoiced%20billing%20options.%0A%0A`}
          className="btn-primary mt-6 w-full"
        >
          Contact sales for {seats} nurses
        </a>
      ) : (
        <SubscribeButton
          plan="institutional"
          tier={ACTIVE_TIER}
          quantity={seats}
          className="mt-6 w-full"
          label={`Subscribe — ${formatter.format(total)} / yr`}
        />
      )}

      <p className="mt-4 text-center font-mono text-[10px] uppercase tracking-label text-ink-3">
        Self-serve up to {SELF_SERVE_SEAT_CAP} nurses · Volume pricing &amp;
        invoiced billing available for {SELF_SERVE_SEAT_CAP}+
      </p>
    </aside>
  );
}
