import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Append-only audit trail for governance-relevant admin actions.
 *
 * Every successful state change in the admin surfaces (config publish, override
 * proposal/approval/rejection, role changes, …) writes one row to
 * `public.audit_log`. Writes go through the service-role client so an event is
 * never silently dropped by an RLS edge case — authorization is already
 * enforced by the calling server action before we get here.
 *
 * Audit writes are best-effort: a failure here is logged but never rolls back
 * or masks the user-visible result of the action that triggered it. Losing an
 * audit row is bad, but failing a completed publish because the audit insert
 * hiccuped is worse.
 */

/** Stable event-type vocabulary. Extend as new audited actions are added. */
export type AuditEventType =
  | "protocol_config.published"
  | "protocol_config.override_proposed"
  | "protocol_config.override_approved"
  | "protocol_config.override_rejected"
  | "customer_user.role_changed";

export type AuditResourceType =
  | "protocol_configs"
  | "customer_users"
  | "clinical_override_proposals";

export type AuditEvent = {
  customerId: string;
  userId: string;
  eventType: AuditEventType;
  resourceType: AuditResourceType;
  /** UUID of the affected row, when there is one. */
  resourceId?: string | null;
  /**
   * Compact JSON describing the change — diffs / before-after of key fields,
   * NOT the full config blob. Keep it small and meaningful.
   */
  payload?: Record<string, unknown>;
};

/** Extract the client IP from the standard proxy headers, best-effort. */
function clientIp(h: Headers): string | null {
  const fwd = h.get("x-forwarded-for");
  if (fwd) {
    // May be a comma-separated list; the left-most entry is the origin client.
    const first = fwd.split(",")[0]?.trim();
    if (first) return first;
  }
  return h.get("x-real-ip");
}

/**
 * Insert one audit_log row. Never throws — failures are logged and swallowed so
 * the caller's primary action is not affected.
 */
export async function writeAuditEvent(event: AuditEvent): Promise<void> {
  try {
    const h = headers();
    const admin = createAdminClient();
    const { error } = await admin.from("audit_log").insert({
      customer_id: event.customerId,
      user_id: event.userId,
      event_type: event.eventType,
      resource_type: event.resourceType,
      resource_id: event.resourceId ?? null,
      payload_json: event.payload ?? {},
      ip_address: clientIp(h),
      user_agent: h.get("user-agent"),
    });
    if (error) {
      console.warn("[auditLog] insert failed:", error.message);
    }
  } catch (err) {
    console.warn(
      "[auditLog] insert threw:",
      err instanceof Error ? err.message : String(err),
    );
  }
}
