// Single source of truth for the AIWIZN engines paywall.
// Switch the early-bird vs regular tier here when ready.
//
// To flip from early-bird to regular pricing, change `ACTIVE_TIER` to "regular"
// (or set NEXT_PUBLIC_PRICING_TIER=regular in Vercel env vars). No other
// changes needed; the pricing page, checkout API, and copy auto-adapt.

export type PriceTier = "early_bird" | "regular";

const ENV_TIER = process.env.NEXT_PUBLIC_PRICING_TIER as PriceTier | undefined;

const FALLBACK_TIER: PriceTier = "early_bird";

export const ACTIVE_TIER: PriceTier =
  ENV_TIER === "regular" || ENV_TIER === "early_bird" ? ENV_TIER : FALLBACK_TIER;

export const PRICE_TIERS: Record<
  PriceTier,
  { label: string; amount: number; display: string; cadence: string; note: string }
> = {
  early_bird: {
    label: "Early bird",
    amount: 9.99,
    display: "$9.99",
    cadence: "per year",
    note: "Limited-time launch pricing — locked in for the lifetime of your first subscription.",
  },
  regular: {
    label: "Standard",
    amount: 29.99,
    display: "$29.99",
    cadence: "per year",
    note: "Annual subscription. Cancel anytime.",
  },
};

export const ACTIVE_PRICE = PRICE_TIERS[ACTIVE_TIER];

export const ENGINES_INCLUDED = [
  {
    title: "AIWIZN Clinical Engine",
    blurb:
      "The NBME-recognised scenario engine — PRAXIS · NARRATIVE · SIMULUS · COGNITA · RESONANCE working in concert.",
  },
  {
    title: "AIWIZN JC 2026 Engine",
    blurb:
      "Joint Commission 2026 readiness — train and assess against the new standards with adaptive, scenario-driven practice.",
  },
];
