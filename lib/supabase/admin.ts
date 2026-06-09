import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase service-role client — bypasses RLS.
 *
 * Use ONLY in trusted server contexts (server actions, route handlers) after
 * the caller's identity and authorization have already been resolved via the
 * RLS-bound {@link createClient}/{@link getCustomerContext}. The service role
 * key never reaches the browser; this module must never be imported into a
 * client component.
 *
 * Mirrors the admin-client pattern used by the Stripe webhook
 * (`app/api/stripe/webhook/route.ts`) so there is one consistent way to obtain
 * an elevated client.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "Missing SUPABASE service-role credentials. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }
  return createSupabaseClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
