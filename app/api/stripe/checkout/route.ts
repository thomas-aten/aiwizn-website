import { NextResponse } from "next/server";
import { ACTIVE_TIER } from "@/lib/pricing";
import { getPriceIdForTier, getStripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * Creates a Stripe Checkout Session for the engines annual subscription.
 * Requires the user to be signed in. Anonymous → 401.
 *
 * Body (optional): { tier?: "early_bird" | "regular" } — defaults to ACTIVE_TIER.
 */
export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    return NextResponse.json(
      { error: "You must be signed in to subscribe." },
      { status: 401 },
    );
  }

  const body = (await request.json().catch(() => ({}))) as {
    tier?: "early_bird" | "regular";
  };
  const tier = body.tier ?? ACTIVE_TIER;
  const priceId = getPriceIdForTier(tier);

  const origin =
    process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin;

  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: user.email,
      client_reference_id: user.id,
      metadata: {
        supabase_user_id: user.id,
        price_tier: tier,
      },
      subscription_data: {
        metadata: {
          supabase_user_id: user.id,
          price_tier: tier,
        },
      },
      success_url: `${origin}/dashboard/engines?checkout=success`,
      cancel_url: `${origin}/pricing?checkout=cancel`,
      allow_promotion_codes: true,
      billing_address_collection: "auto",
    });

    if (!session.url) {
      throw new Error("Stripe did not return a checkout URL.");
    }
    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Checkout failed.";
    console.error("[checkout] error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
