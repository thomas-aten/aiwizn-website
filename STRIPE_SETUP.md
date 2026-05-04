# Stripe setup — engines paywall

One-time setup to wire the AIWIZN engines bundle behind a paid annual subscription.

**End state:** `https://www.aiwizn.com/pricing` charges `$9.99/yr` (early bird) or `$29.99/yr` (standard) via Stripe Checkout. Successful payment grants the user access to `/dashboard/engines/clinical` and `/dashboard/engines/jc2026`.

---

## 1 · Create the Stripe account & product

1. Sign up at <https://dashboard.stripe.com>.
2. **Products → + Add product:**
   - **Name:** AIWIZN Engines — Annual
   - **Description:** Annual access to the AIWIZN Clinical Engine and JC 2026 Engine.
   - Add **two prices** to this same product:
     - **Early bird** — `$9.99` USD, recurring **yearly**, lookup key: `aiwizn_engines_annual_early_bird`
     - **Standard** — `$29.99` USD, recurring **yearly**, lookup key: `aiwizn_engines_annual_regular`
   - Hit **Save**.
3. Copy the two **price IDs** (start with `price_…`). You'll paste them into env vars below.

## 2 · Get the API keys

1. **Developers → API keys**
2. Copy the **Secret key** (`sk_test_…` for testing, `sk_live_…` for production).
   - You'll set `sk_test_…` in local `.env.local` and `sk_live_…` in Vercel production env.

## 3 · Set the webhook endpoint

1. **Developers → Webhooks → + Add endpoint**
2. Endpoint URL: `https://www.aiwizn.com/api/stripe/webhook`
   - For local testing, use the Stripe CLI: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
3. **Events to listen to:**
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `customer.subscription.paused`
   - `customer.subscription.resumed`
   - `customer.subscription.trial_will_end`
4. Copy the **Signing secret** (`whsec_…`).

## 4 · Get the Supabase service-role key

1. <https://supabase.com/dashboard/project/scyfldezhztapttcyenr/settings/api>
2. Copy the **`service_role`** secret key (the long JWT, **NOT** the publishable / `anon` key).
3. ⚠️ This bypasses RLS. Only ever use it on the server (Vercel env vars + `.env.local`). Never expose it to the browser.

## 5 · Set env vars in Vercel

Vercel → Project `aiwizn-website` → Settings → Environment Variables. Add these to **Production** (and optionally Preview):

| Variable | Value |
| --- | --- |
| `STRIPE_SECRET_KEY` | `sk_live_…` (or `sk_test_…` for preview) |
| `STRIPE_WEBHOOK_SECRET` | `whsec_…` from step 3 |
| `STRIPE_PRICE_ID_EARLY_BIRD` | `price_…` for the $9.99 price |
| `STRIPE_PRICE_ID_REGULAR` | `price_…` for the $29.99 price |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOi…` from step 4 |
| `NEXT_PUBLIC_PRICING_TIER` | `early_bird` (flip to `regular` when you want the price to switch) |

Trigger a redeploy after adding (Deployments → ⋯ → Redeploy).

## 6 · Smoke-test in Stripe test mode

1. Start with test keys (`sk_test_…`, test webhook signing secret) on a Vercel **preview** environment, OR run the Stripe CLI listener locally.
2. Sign in to the site (`/signup` if you don't have an account).
3. Visit `/pricing` → click **Subscribe now**.
4. Use Stripe's test card: `4242 4242 4242 4242`, any future expiry, any CVC, any ZIP.
5. After redirect to `/dashboard/engines?checkout=success`, verify:
   - The teal "Subscription active" banner appears.
   - `https://supabase.com/dashboard/project/scyfldezhztapttcyenr/editor/website.subscriptions` has a new row with `status = active`.
   - You can launch both engines.

## 7 · Flip from early-bird to standard pricing

Two ways:

- **Vercel env var (no code change):** set `NEXT_PUBLIC_PRICING_TIER=regular` and redeploy.
- **Code constant:** edit the `FALLBACK_TIER` in [`lib/pricing.ts`](./lib/pricing.ts) and push.

Either way, `/pricing` will start showing the `$29.99` price and Stripe will charge against the regular price ID. Existing subscribers stay on whatever rate they signed up at — Stripe handles this automatically.

## 8 · (Optional) Customer portal

To let subscribers cancel / update billing themselves, enable the Stripe Customer Portal:

1. Stripe Dashboard → Settings → Billing → Customer portal → **Activate**
2. We can wire a `/dashboard/billing` link that hits `stripe.billingPortal.sessions.create()` next iteration.

---

## Local development

```bash
cp .env.example .env.local
# fill in test keys + price IDs + service role key
npm install
npm run dev
# in a second terminal:
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

When `stripe listen` starts it prints the local webhook signing secret — paste that into `.env.local` as `STRIPE_WEBHOOK_SECRET`.
