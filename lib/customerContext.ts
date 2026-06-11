import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

/**
 * Customer-scoped role/identity for the current authenticated user, resolved
 * from `customer_users` (RLS enforces per-customer isolation). Shared by the
 * admin layout, the config page, and the dashboard nav so role is fetched once
 * per concern rather than duplicated across files.
 *
 * Sprint 6.1 — multi-membership support
 * -------------------------------------
 * A user may be `admin` (or any role) of more than one customer at once — the
 * platform owner is the canonical case (Demo + WakeMed today, Demo + WakeMed +
 * Duke tomorrow). The previous shape forced a single `customer_id` and used
 * `.maybeSingle()`, which errors when a user has >1 row and silently dropped
 * those users into the "unassigned" branch — hiding the admin nav.
 *
 * The new shape exposes the full set of `memberships` and an `activeCustomerId`
 * chosen from a `aiwizn.selectedCustomerId` cookie (set by the customer
 * switcher) or, as a deterministic default, the earliest-joined membership.
 *
 * For backwards compatibility, the legacy `customerId` / `role` / `canEdit`
 * fields are kept as aliases for the active membership, so consumers that
 * haven't been migrated to `activeCustomerId` still behave correctly for
 * single-membership users.
 */

export type CustomerRole = "admin" | "educator" | "cno" | "learner";

export type Membership = {
  customerId: string;
  customerSlug: string;
  customerName: string;
  role: CustomerRole;
};

export type CustomerContext =
  // Signed in, attached to at least one customer, active membership resolved.
  | {
      status: "ok";
      userId: string;
      memberships: Membership[];
      activeCustomerId: string;
      /** Active membership's customerId (alias of activeCustomerId). */
      customerId: string;
      /** Active membership's role. */
      role: CustomerRole;
      /** True iff active membership's role is admin. */
      canEdit: boolean;
    }
  // Signed in + entitled but not attached to any customer → empty state.
  | { status: "unassigned"; userId: string }
  // Not signed in.
  | { status: "anonymous" };

/** Cookie name used by the customer-switcher to persist the active selection. */
export const ACTIVE_CUSTOMER_COOKIE = "aiwizn.selectedCustomerId";

const KNOWN_ROLES: CustomerRole[] = ["admin", "educator", "cno", "learner"];

function normalizeRole(raw: unknown): CustomerRole {
  return typeof raw === "string" && (KNOWN_ROLES as string[]).includes(raw)
    ? (raw as CustomerRole)
    : "learner"; // Unknown/missing role → least-privileged.
}

/**
 * Resolve the current user's customer context.
 *
 * Mirrors the defensive posture of the Sprint 2 engine loader: a missing
 * `customer_users` table (provisioned in a parallel track) or a query error is
 * treated as "no admin rights" rather than a crash — the user falls through to
 * read-only/unassigned handling instead of seeing a 500.
 */
export async function getCustomerContext(): Promise<CustomerContext> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { status: "anonymous" };

  // Join customers so the switcher can render slug + name without a second
  // round-trip. Order by created_at ascending so the deterministic default
  // (earliest-joined customer) is stable across requests.
  const { data, error } = await supabase
    .from("customer_users")
    .select("customer_id, role, created_at, customers!inner(id, slug, name)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (error) {
    // Table not provisioned / transient error — treat as no customer mapping.
    console.warn("[customerContext] customer_users unavailable:", error.message);
    return { status: "unassigned", userId: user.id };
  }

  const memberships: Membership[] = (data ?? [])
    .map((row): Membership | null => {
      const customerId = row?.customer_id as string | undefined;
      if (!customerId) return null;
      // PostgREST embedded resource may surface as object or single-element array.
      const c = Array.isArray(row.customers) ? row.customers[0] : row.customers;
      const customerSlug = ((c?.slug as string | undefined) ?? "").trim() || "unknown";
      const customerName =
        ((c?.name as string | undefined) ?? "").trim() || "Unknown workspace";
      return {
        customerId,
        customerSlug,
        customerName,
        role: normalizeRole(row.role),
      };
    })
    .filter((m): m is Membership => m !== null);

  if (memberships.length === 0) {
    return { status: "unassigned", userId: user.id };
  }

  // Active membership: cookie-pinned if valid; otherwise first by created_at.
  const cookieStore = cookies();
  const selected = cookieStore.get(ACTIVE_CUSTOMER_COOKIE)?.value;
  const active =
    (selected && memberships.find((m) => m.customerId === selected)) ||
    memberships[0];

  return {
    status: "ok",
    userId: user.id,
    memberships,
    activeCustomerId: active.customerId,
    customerId: active.customerId,
    role: active.role,
    canEdit: active.role === "admin",
  };
}
