import Stripe from "stripe";

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

export function getPriceIdForTier(
  tier: "early_bird" | "regular",
): string {
  const id =
    tier === "early_bird"
      ? process.env.STRIPE_PRICE_ID_EARLY_BIRD
      : process.env.STRIPE_PRICE_ID_REGULAR;
  if (!id) {
    throw new Error(
      `Missing STRIPE_PRICE_ID_${tier.toUpperCase()} env var. ` +
        "Create the price in Stripe Dashboard and add the price ID to env.",
    );
  }
  return id;
}
