import { createClient } from "@/lib/supabase/server";
import type { ClinicalOverridesConfig } from "@/lib/protocolConfig";

/**
 * Read helpers for the clinical-override review queue
 * (`public.clinical_override_proposals`, migration multitenancy_010).
 *
 * Reads go through the RLS-bound server client: a user only ever sees proposals
 * for a customer they belong to. Writes (insert/approve/reject) live in the
 * relevant server actions and use the service-role client.
 */

export type ProposalStatus = "pending" | "approved" | "rejected" | "withdrawn";

export type ClinicalOverrideProposal = {
  id: string;
  customer_id: string;
  engine_slug: string;
  proposed_clinical_overrides: ClinicalOverridesConfig;
  proposed_by: string;
  proposed_at: string;
  status: ProposalStatus;
  reviewer_id: string | null;
  reviewed_at: string | null;
  reviewer_notes: string | null;
  resulting_config_id: string | null;
};

/**
 * Count pending proposals for a customer — drives the nav badge. Defensive: a
 * missing table or query error yields 0 rather than a crash, mirroring the
 * Sprint 2/5 loaders.
 */
export async function countPendingProposals(
  customerId: string,
): Promise<number> {
  const supabase = createClient();
  const { count, error } = await supabase
    .from("clinical_override_proposals")
    .select("id", { count: "exact", head: true })
    .eq("customer_id", customerId)
    .eq("status", "pending");

  if (error) {
    console.warn(
      "[clinicalOverrideProposals] pending count failed:",
      error.message,
    );
    return 0;
  }
  return count ?? 0;
}

/** List pending proposals for a customer, newest first. */
export async function listPendingProposals(
  customerId: string,
): Promise<ClinicalOverrideProposal[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("clinical_override_proposals")
    .select(
      "id, customer_id, engine_slug, proposed_clinical_overrides, proposed_by, proposed_at, status, reviewer_id, reviewed_at, reviewer_notes, resulting_config_id",
    )
    .eq("customer_id", customerId)
    .eq("status", "pending")
    .order("proposed_at", { ascending: false });

  if (error) {
    console.warn(
      "[clinicalOverrideProposals] list failed:",
      error.message,
    );
    return [];
  }
  return (data ?? []) as ClinicalOverrideProposal[];
}
