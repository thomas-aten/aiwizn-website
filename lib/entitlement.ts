import { createClient } from "@/lib/supabase/server";

/**
 * True if the current authenticated user has an active or trialing engines
 * subscription. Calls the public.has_active_engines_subscription RPC.
 */
export async function hasActiveEnginesSubscription(): Promise<boolean> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc(
    "has_active_engines_subscription",
  );
  if (error) {
    console.error("[entitlement] RPC error:", error.message);
    return false;
  }
  return data === true;
}
