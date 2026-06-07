import { createClient } from "@/lib/supabase/server";

/**
 * Customer-scoped role/identity for the current authenticated user, resolved
 * from `customer_users` (RLS enforces per-customer isolation). Shared by the
 * admin layout, the config page, and the dashboard nav so role is fetched once
 * per concern rather than duplicated across files.
 */

export type CustomerRole = "admin" | "educator" | "cno" | "learner";

export type CustomerContext =
  // Signed in, attached to a customer, role resolved.
  | {
      status: "ok";
      userId: string;
      customerId: string;
      role: CustomerRole;
      canEdit: boolean;
    }
  // Signed in + entitled but not attached to any customer → empty state.
  | { status: "unassigned"; userId: string }
  // Not signed in.
  | { status: "anonymous" };

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

  const { data, error } = await supabase
    .from("customer_users")
    .select("customer_id, role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    // Table not provisioned / transient error — treat as no customer mapping.
    console.warn("[customerContext] customer_users unavailable:", error.message);
    return { status: "unassigned", userId: user.id };
  }

  if (!data?.customer_id) {
    return { status: "unassigned", userId: user.id };
  }

  const role = normalizeRole(data.role);
  return {
    status: "ok",
    userId: user.id,
    customerId: data.customer_id as string,
    role,
    canEdit: role === "admin",
  };
}
