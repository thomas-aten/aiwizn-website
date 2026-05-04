import Stripe from "stripe";
import { PLANS, type Plan, type PriceTier } from "@/lib/pricing";

let cachedStripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (cachedStripe) return cachedStripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error(
      "STRIPE_SECRET_KEY is not set. Add it to .env.local and Vercel project env.",
    );
  }
  cachedStripe = new Stripe(key, {
    // Pin to a known-good API version so behavior is stable across SDK upgrades.
    apiVersion: "2024-09-30.acacia" as Stripe.LatestApiVersion,
    typescript: true,
  });
  return cachedStripe;
}

/**
 * Resolves the Stripe price ID for a given plan + tier from env vars.
 * Throws a clear error if the matching env var is missing.
 */
export function getPriceId(plan: Plan, tier: PriceTier): string {
  const envKey = PLANS[plan].envKey[tier];
  const id = process.env[envKey];
  if (!id) {
    throw new Error(
      `Missing ${envKey} env var. Create the price in Stripe Dashboard and add the price ID to env.`,
    );
  }
  return id;
}
