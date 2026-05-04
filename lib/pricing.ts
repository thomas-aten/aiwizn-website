// Single source of truth for the AIWIZN engines paywall.
// Switch the early-bird vs regular tier here when ready.
//
// To flip from early-bird to regular pricing, change the env var
// NEXT_PUBLIC_PRICING_TIER from "early_bird" to "regular" in Vercel
// (or set FALLBACK_TIER below). Both individual and institutional
// plans switch in lockstep.

export type PriceTier = "early_bird" | "regular";
export type Plan = "individual" | "institutional";

const ENV_TIER = process.env.NEXT_PUBLIC_PRICING_TIER as PriceTier | undefined;
const FALLBACK_TIER: PriceTier = "early_bird";

export const ACTIVE_TIER: PriceTier =
  ENV_TIER === "regular" || ENV_TIER === "early_bird"
    ? ENV_TIER
    : FALLBACK_TIER;

interface PlanPrice {
  /** Decimal amount in USD, e.g. 9.99 */
  amount: number;
  display: string;
  cadence: string;
  /** When true, amount is per-seat (per nurse) */
  perSeat: boolean;
  /** Display label for the tier (e.g. "Early bird") */
  label: string;
  note: string;
}

interface PlanConfig {
  id: Plan;
  name: string;
  audience: string;
  prices: Record<PriceTier, PlanPrice>;
  /** Key used to look up the Stripe price ID env var */
  envKey: Record<PriceTier, string>;
}

export const PLANS: Record<Plan, PlanConfig> = {
  individual: {
    id: "individual",
    name: "Individual",
    audience: "For clinicians, faculty, and self-paced learners.",
    envKey: {
      early_bird: "STRIPE_PRICE_ID_EARLY_BIRD",
      regular: "STRIPE_PRICE_ID_REGULAR",
    },
    prices: {
      early_bird: {
        amount: 9.99,
        display: "$9.99",
        cadence: "per year",
        perSeat: false,
        label: "Early bird",
        note: "Limited-time launch pricing — locked in for the lifetime of your first subscription.",
      },
      regular: {
        amount: 29.99,
        display: "$29.99",
        cadence: "per year",
        perSeat: false,
        label: "Standard",
        note: "Annual subscription. Cancel anytime.",
      },
    },
  },
  institutional: {
    id: "institutional",
    name: "Hospitals & Schools",
    audience:
      "For hospitals, health systems, and nursing schools. Per-nurse seat pricing.",
    envKey: {
      early_bird: "STRIPE_PRICE_ID_INSTITUTIONAL_EARLY_BIRD",
      regular: "STRIPE_PRICE_ID_INSTITUTIONAL_REGULAR",
    },
    prices: {
      early_bird: {
        amount: 279.99,
        display: "$279.99",
        cadence: "per nurse / year",
        perSeat: true,
        label: "Early bird",
        note: "Launch pricing for institutions — locked in at renewal.",
      },
      regular: {
        amount: 349.99,
        display: "$349.99",
        cadence: "per nurse / year",
        perSeat: true,
        label: "Standard",
        note: "Annual seat licenses. Cancel anytime.",
      },
    },
  },
};

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

export function getActivePrice(plan: Plan): PlanPrice {
  return PLANS[plan].prices[ACTIVE_TIER];
}

export function getRegularPrice(plan: Plan): PlanPrice {
  return PLANS[plan].prices.regular;
}

/** Default seat count surfaced in the institutional card. */
export const DEFAULT_INSTITUTIONAL_SEATS = 25;

/** Self-serve cap. Beyond this we route to contact sales. */
export const SELF_SERVE_SEAT_CAP = 100;
