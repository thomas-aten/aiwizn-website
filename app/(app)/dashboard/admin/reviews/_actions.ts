"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCustomerContext } from "@/lib/customerContext";
import { writeAuditEvent } from "@/lib/auditLog";
import {
  migrateToV11,
  validateProtocolConfig,
  type ClinicalOverridesConfig,
  type ProtocolConfigV11,
} from "@/lib/protocolConfig";

/**
 * Server actions for the clinical-override review queue
 * (`/dashboard/admin/reviews`, Sprint 5.5).
 *
 * Authorization is enforced server-side: only a customer admin (the interim
 * reviewer role) may approve or reject, and only proposals belonging to the
 * caller's own customer. Both actions write an `audit_log` row.
 */

// Must match the canonical slug used by the config editor's publish flow.
const CANONICAL_SLUG = "clinical-engine";

export type ReviewResult =
  | { status: "approved"; version: number }
  | { status: "rejected" }
  | { status: "error"; errors: string[] };

type LoadedProposal = {
  id: string;
  customer_id: string;
  proposed_clinical_overrides: ClinicalOverridesConfig;
};

/** Load a pending proposal scoped to the caller's customer, or an error. */
async function loadPending(
  supabase: ReturnType<typeof createClient>,
  proposalId: string,
  customerId: string,
): Promise<LoadedProposal | { error: string }> {
  const { data, error } = await supabase
    .from("clinical_override_proposals")
    .select("id, customer_id, proposed_clinical_overrides, status")
    .eq("id", proposalId)
    .maybeSingle();

  if (error) return { error: error.message };
  if (!data) return { error: "Proposal not found." };
  if (data.customer_id !== customerId) {
    return { error: "Proposal belongs to another workspace." };
  }
  if (data.status !== "pending") {
    return { error: `Proposal is already ${data.status}.` };
  }
  return {
    id: data.id as string,
    customer_id: data.customer_id as string,
    proposed_clinical_overrides:
      data.proposed_clinical_overrides as ClinicalOverridesConfig,
  };
}

/**
 * Approve a proposal: merge the proposed clinical_overrides into a new
 * protocol_configs version, mark the proposal approved, and audit both events.
 */
export async function approveProposal(
  proposalId: string,
  notes: string,
): Promise<ReviewResult> {
  const ctx = await getCustomerContext();
  if (ctx.status !== "ok") {
    return { status: "error", errors: ["Not signed in to a workspace."] };
  }
  if (!ctx.canEdit) {
    return {
      status: "error",
      errors: ["Only a customer admin can review clinical overrides."],
    };
  }

  const supabase = createClient();
  const proposal = await loadPending(supabase, proposalId, ctx.customerId);
  if ("error" in proposal) {
    return { status: "error", errors: [proposal.error] };
  }

  // Resolve the current published config and merge the proposed overrides in.
  const { data: existingRow, error: readErr } = await supabase
    .from("protocol_configs")
    .select("config_json, version")
    .eq("customer_id", ctx.customerId)
    .eq("engine_slug", CANONICAL_SLUG)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (readErr) {
    return { status: "error", errors: [`Could not read config: ${readErr.message}`] };
  }

  const current = migrateToV11(existingRow?.config_json);
  const prevVersion =
    typeof existingRow?.version === "number" && Number.isFinite(existingRow.version)
      ? existingRow.version
      : 0;
  const nextVersion = prevVersion + 1;

  const merged: ProtocolConfigV11 = {
    ...current,
    clinical_overrides: proposal.proposed_clinical_overrides,
  };

  const validated = validateProtocolConfig(merged);
  if (!validated.ok) {
    return {
      status: "error",
      errors: [
        "Merged config is invalid — proposal cannot be applied:",
        ...validated.errors,
      ],
    };
  }

  const { data: cfgRow, error: cfgErr } = await supabase
    .from("protocol_configs")
    .insert({
      customer_id: ctx.customerId,
      engine_slug: CANONICAL_SLUG,
      config_json: validated.config,
      version: nextVersion,
      effective_from: new Date().toISOString(),
      created_by: ctx.userId,
    })
    .select("id")
    .single();

  if (cfgErr || !cfgRow) {
    return {
      status: "error",
      errors: [`Could not publish merged config: ${cfgErr?.message ?? "no row"}`],
    };
  }
  const resultingConfigId = cfgRow.id as string;

  const { error: updErr } = await supabase
    .from("clinical_override_proposals")
    .update({
      status: "approved",
      reviewer_id: ctx.userId,
      reviewed_at: new Date().toISOString(),
      reviewer_notes: notes.trim() || null,
      resulting_config_id: resultingConfigId,
    })
    .eq("id", proposal.id);

  if (updErr) {
    // The config was published; surface the partial state rather than silently
    // leaving the proposal "pending" forever.
    return {
      status: "error",
      errors: [
        `Config v${nextVersion} published, but updating the proposal failed: ${updErr.message}. Re-check the queue.`,
      ],
    };
  }

  await writeAuditEvent({
    customerId: ctx.customerId,
    userId: ctx.userId,
    eventType: "protocol_config.published",
    resourceType: "protocol_configs",
    resourceId: resultingConfigId,
    payload: {
      version: nextVersion,
      engine_slug: CANONICAL_SLUG,
      source: "clinical_override_approval",
      proposal_id: proposal.id,
    },
  });
  await writeAuditEvent({
    customerId: ctx.customerId,
    userId: ctx.userId,
    eventType: "protocol_config.override_approved",
    resourceType: "clinical_override_proposals",
    resourceId: proposal.id,
    payload: {
      resulting_config_id: resultingConfigId,
      version: nextVersion,
      applied_clinical_overrides: proposal.proposed_clinical_overrides,
      reviewer_notes: notes.trim() || null,
    },
  });

  revalidatePath("/dashboard/admin/reviews");
  revalidatePath("/dashboard/admin/config");
  revalidatePath("/dashboard/engines", "layout");

  return { status: "approved", version: nextVersion };
}

/** Reject a proposal: mark it rejected with notes; no config row is written. */
export async function rejectProposal(
  proposalId: string,
  notes: string,
): Promise<ReviewResult> {
  const ctx = await getCustomerContext();
  if (ctx.status !== "ok") {
    return { status: "error", errors: ["Not signed in to a workspace."] };
  }
  if (!ctx.canEdit) {
    return {
      status: "error",
      errors: ["Only a customer admin can review clinical overrides."],
    };
  }

  const supabase = createClient();
  const proposal = await loadPending(supabase, proposalId, ctx.customerId);
  if ("error" in proposal) {
    return { status: "error", errors: [proposal.error] };
  }

  const { error: updErr } = await supabase
    .from("clinical_override_proposals")
    .update({
      status: "rejected",
      reviewer_id: ctx.userId,
      reviewed_at: new Date().toISOString(),
      reviewer_notes: notes.trim() || null,
    })
    .eq("id", proposal.id);

  if (updErr) {
    return { status: "error", errors: [`Could not reject: ${updErr.message}`] };
  }

  await writeAuditEvent({
    customerId: ctx.customerId,
    userId: ctx.userId,
    eventType: "protocol_config.override_rejected",
    resourceType: "clinical_override_proposals",
    resourceId: proposal.id,
    payload: {
      rejected_clinical_overrides: proposal.proposed_clinical_overrides,
      reviewer_notes: notes.trim() || null,
    },
  });

  revalidatePath("/dashboard/admin/reviews");

  return { status: "rejected" };
}
