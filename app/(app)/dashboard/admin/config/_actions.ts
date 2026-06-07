"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCustomerContext } from "@/lib/customerContext";
import {
  clinicalOverridesChanged,
  migrateToV11,
  validateProtocolConfig,
  type ProtocolConfigV11,
} from "@/lib/protocolConfig";

/**
 * Server actions for the customer-admin config editor.
 *
 * Authorization is enforced server-side on every call via
 * {@link getCustomerContext} — the client `canEdit` flag is UX only and is
 * never trusted here. A non-admin (or unassigned/anonymous) caller is rejected
 * regardless of what the form submits.
 */

export type PublishResult =
  | { status: "published"; version: number }
  | {
      // clinical_overrides changed → staged for medical-reviewer approval
      // instead of auto-publishing. No row is written this sprint.
      status: "staged_for_review";
      version: number; // the version this WOULD become once approved
    }
  | { status: "error"; errors: string[] };

/**
 * The engine_slug under which a customer's canonical config row lives.
 *
 * Sprint 2 keys `protocol_configs` by (customer_id, engine_slug) and reads the
 * most-recent row per engine. The admin editor manages one canonical config
 * blob (which itself carries per-engine scenario_overrides), so we persist it
 * under a single canonical slug. The page seeds the editor from the customer's
 * most-recent row regardless of slug; on publish we write back to this slug so
 * versioning stays coherent.
 *
 * NOTE (deferred): wiring every engine's [slug] read to this canonical row is a
 * v7.0.0-alpha.7 follow-up. For now the canonical slug doubles as the primary
 * engine config.
 */
const CANONICAL_SLUG = "clinical-engine";

/** Read the current max version for this customer's canonical config. */
async function currentVersion(
  supabase: ReturnType<typeof createClient>,
  customerId: string,
): Promise<number> {
  const { data, error } = await supabase
    .from("protocol_configs")
    .select("version")
    .eq("customer_id", customerId)
    .eq("engine_slug", CANONICAL_SLUG)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    // `version` column absent or table issue — fall back to created_at ordering
    // count semantics by treating as version 0 (first publish becomes v1).
    console.warn("[config/_actions] version lookup failed:", error.message);
    return 0;
  }
  const v = data?.version;
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

/**
 * Validate the proposed config and publish a new versioned row — UNLESS the
 * clinical_overrides section changed, in which case the change is staged for
 * medical-reviewer approval and no row is written (governance gate).
 */
export async function publishConfig(
  proposed: unknown,
): Promise<PublishResult> {
  const ctx = await getCustomerContext();
  if (ctx.status !== "ok") {
    return { status: "error", errors: ["Not signed in to a workspace."] };
  }
  if (!ctx.canEdit) {
    return {
      status: "error",
      errors: ["View-only — only a customer admin can publish config changes."],
    };
  }

  // Validate against the v1.1 schema before anything touches the database.
  const validated = validateProtocolConfig(proposed);
  if (!validated.ok) {
    return { status: "error", errors: validated.errors };
  }
  const next: ProtocolConfigV11 = validated.config;

  const supabase = createClient();
  const prevVersion = await currentVersion(supabase, ctx.customerId);
  const nextVersion = prevVersion + 1;

  // Governance gate: clinical_overrides edits route to the review queue.
  const { data: existingRow } = await supabase
    .from("protocol_configs")
    .select("config_json")
    .eq("customer_id", ctx.customerId)
    .eq("engine_slug", CANONICAL_SLUG)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const current = migrateToV11(
    existingRow?.config_json,
    next.branding.slug,
    next.branding.customer_name,
  );

  if (clinicalOverridesChanged(current, next)) {
    // Out of scope this sprint: insert into a clinical_override_reviews queue.
    // For now we DO NOT write the protocol_configs row — we report that the
    // change is staged so a medical reviewer can approve it.
    return { status: "staged_for_review", version: nextVersion };
  }

  const { error } = await supabase.from("protocol_configs").insert({
    customer_id: ctx.customerId,
    engine_slug: CANONICAL_SLUG,
    config_json: next,
    version: nextVersion,
    effective_from: new Date().toISOString(),
    created_by: ctx.userId,
  });

  if (error) {
    console.error("[config/_actions] publish insert failed:", error.message);
    return {
      status: "error",
      errors: [`Could not publish: ${error.message}`],
    };
  }

  // Engine loader reads the most-recent row — refresh cached routes.
  revalidatePath("/dashboard/admin/config");
  revalidatePath("/dashboard/engines", "layout");

  return { status: "published", version: nextVersion };
}
