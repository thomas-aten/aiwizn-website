"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { ACTIVE_CUSTOMER_COOKIE, getCustomerContext } from "@/lib/customerContext";

/**
 * Server actions for the authenticated app shell (`app/(app)/...`).
 *
 * Sprint 6.1 introduces `setActiveCustomer` so a multi-membership user (the
 * platform owner today) can flip between the customer workspaces they belong
 * to. The active selection is persisted in a httpOnly cookie that the server
 * context (`getCustomerContext`) reads on every request.
 */

export type SetActiveCustomerResult = { ok: true } | { error: string };

/**
 * Pin the active customer workspace for the current session.
 *
 * Authorization: we resolve the caller's memberships via the RLS-bound context
 * and reject any customerId that isn't in the set. RLS would catch unauthorized
 * reads/writes downstream anyway, but failing fast keeps the nav and audit
 * trail coherent (you can't "switch into" a workspace you don't belong to).
 */
export async function setActiveCustomer(
  customerId: string,
): Promise<SetActiveCustomerResult> {
  if (typeof customerId !== "string" || customerId.length === 0) {
    return { error: "Missing customerId." };
  }

  const ctx = await getCustomerContext();
  if (ctx.status !== "ok") {
    return { error: "Not signed in to a workspace." };
  }

  const member = ctx.memberships.find((m) => m.customerId === customerId);
  if (!member) {
    // Defensive: don't leak whether the customer exists vs. caller-not-a-member.
    return { error: "You are not a member of that workspace." };
  }

  const cookieStore = cookies();
  cookieStore.set(ACTIVE_CUSTOMER_COOKIE, customerId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: "/",
  });

  // The active customer scopes nav, admin gates, config reads, and audit
  // payloads — refresh the entire app shell so the next render uses the new
  // context everywhere.
  revalidatePath("/dashboard", "layout");

  return { ok: true };
}
