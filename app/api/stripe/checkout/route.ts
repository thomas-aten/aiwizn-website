import { NextResponse } from "next/server";
import {
  ACTIVE_TIER,
  SELF_SERVE_SEAT_CAP,
  type Plan,
  type PriceTier,
} from "@/lib/pricing";
import { getPriceId, getStripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * Creates a Stripe Checkout Session for the engines annual subscription.
 * Requires the user to be signed in.
 *
 * Body:
 *   plan?: "individual" | "institutional"   (default "individual")
 *   tier?: "early_bird" | "regular"          (default ACTIVE_TIER)
 *   quantity?: number                        (default 1; institutional = nurse count)
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
    plan?: Plan;
    tier?: PriceTier;
    quantity?: number;
  };

  const plan: Plan = body.plan === "institutional" ? "institutional" : "individual";
  const tier: PriceTier = body.tier ?? ACTIVE_TIER;

  const isInstitutional = plan === "institutional";
  const rawQty = body.quantity;
  const requestedQty =
    typeof rawQty === "number" && Number.isFinite(rawQty) ? Math.floor(rawQty) : 1;
  const quantity = isInstitutional ? Math.max(1, requestedQty) : 1;

  if (isInstitutional && quantity > SELF_SERVE_SEAT_CAP) {
    return NextResponse.json(
      {
        error: `For ${SELF_SERVE_SEAT_CAP}+ nurses, please email Thomas@ateninc.com for volume pricing and invoiced billing.`,
      },
      { status: 400 },
    );
  }

  let priceId = "";
  try {
    priceId = getPriceId(plan, tier);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Stripe price not configured." },
      { status: 500 },
    );
  }

  const origin =
    process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin;

  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity }],
      customer_email: user.email,
      client_reference_id: user.id,
      metadata: {
        supabase_user_id: user.id,
        plan,
        price_tier: tier,
        seat_count: String(quantity),
      },
      subscription_data: {
        metadata: {
          supabase_user_id: user.id,
          plan,
          price_tier: tier,
          seat_count: String(quantity),
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

