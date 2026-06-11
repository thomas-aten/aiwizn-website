import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Platform-admin gate for the Sprint 7 customer-onboarding UI.
 *
 * The eventual model is a named `platform_admin` role inside
 * `customer_users.role`, with its own RLS policies. Until that lands, we
 * approximate the role with a deterministic rule:
 *
 *   A user is a platform admin iff they are `admin` of *every* customer that
 *   was seeded into `customers` at or before the Sprint 1 cutover.
 *
 * That set is locked to the seed cohort (Demo Hospital + WakeMed today). It
 * does NOT widen as new customers are provisioned through this UI — otherwise
 * creating Duke would lock out everyone who isn't an admin of Duke yet,
 * including the user who just provisioned it.
 *
 * Anchoring on `created_at <= SEED_CUTOFF` is intentionally simple. When the
 * named role ships, this whole helper collapses to a single `role` check and
 * the cutoff disappears.
 */

/**
 * Seed cutoff. Customers created at or before this instant are part of the
 * platform-admin gate; later ones are not. Set to a moment shortly after
 * Sprint 1 seed (Demo + WakeMed). Update only if the seed cohort changes.
 */
const SEED_CUTOFF = "2026-06-09T00:00:00Z";

export type PlatformAdminCheck = {
  allowed: boolean;
  /** Number of seed customers the user is admin of. */
  matched: number;
  /** Total seed customers — `allowed` true iff matched === total and total > 0. */
  totalSeed: number;
};

/**
 * Resolve whether the given user passes the platform-admin gate. Service-role
 * client so RLS doesn't hide rows from the count — authorization is implicit
 * in the SEED_CUTOFF filter (no per-user reachable data is exposed).
 */
export async function isPlatformAdmin(userId: string): Promise<PlatformAdminCheck> {
  const admin = createAdminClient();

  const { data: seedRows, error: seedErr } = await admin
    .from("customers")
    .select("id")
    .lte("created_at", SEED_CUTOFF);

  if (seedErr) {
    console.warn("[platformAdmin] seed lookup failed:", seedErr.message);
    return { allowed: false, matched: 0, totalSeed: 0 };
  }
  const seedIds = (seedRows ?? []).map((r) => r.id as string);
  if (seedIds.length === 0) {
    // No seed cohort to anchor on — fail closed.
    return { allowed: false, matched: 0, totalSeed: 0 };
  }

  const { data: memberships, error: memErr } = await admin
    .from("customer_users")
    .select("customer_id, role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .in("customer_id", seedIds);

  if (memErr) {
    console.warn("[platformAdmin] membership lookup failed:", memErr.message);
    return { allowed: false, matched: 0, totalSeed: seedIds.length };
  }

  const matched = new Set((memberships ?? []).map((m) => m.customer_id as string))
    .size;
  return {
    allowed: matched === seedIds.length,
    matched,
    totalSeed: seedIds.length,
  };
}
