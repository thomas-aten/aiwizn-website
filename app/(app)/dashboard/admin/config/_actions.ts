"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCustomerContext, type CustomerContext } from "@/lib/customerContext";
import { writeAuditEvent } from "@/lib/auditLog";
import {
  clinicalOverridesChanged,
  denormalizeStandingOrders,
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
 *
 * Every successful state change writes an append-only `audit_log` row via
 * {@link writeAuditEvent} (Sprint 5.5).
 */

export type PublishResult =
  | { status: "published"; version: number }
  | {
      // clinical_overrides changed → staged for medical-reviewer approval.
      // Non-clinical sections (if any changed) still publish as version+1.
      status: "staged_for_review";
      proposal_id: string;
      /** version published for the non-clinical sections, or null if none changed */
      published_version: number | null;
      message: string;
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

/** Top-level config sections that differ between two configs (for audit payloads). */
function changedSections(
  a: ProtocolConfigV11,
  b: ProtocolConfigV11,
): string[] {
  const keys = Object.keys(b) as (keyof ProtocolConfigV11)[];
  return keys.filter(
    (k) => JSON.stringify(a[k]) !== JSON.stringify(b[k]),
  );
}

/**
 * Build the wire shape we actually persist for a given config.
 *
 * The clinical engine (still on the Sprint 6 flat shape; pathway-aware engine
 * work is deferred to Sprint 7.1) reads top-level keys under
 * `standing_orders`, e.g. `standing_orders.nurse_initiate_aspirin`. The
 * editor authors the new nested-by-pathway shape (`standing_orders.stemi.nurse_initiate_aspirin`).
 *
 * To keep both readers happy during the transition we dual-write into the
 * SAME `standing_orders` object:
 *
 *   standing_orders: {
 *     stemi: { ... },              ← authoritative, read by next editor + engine
 *     stroke: { ... },
 *     sepsis: { ... },
 *     general: { ... },
 *     nurse_initiate_aspirin: "on", ← flat alias the engine reads today
 *     nurse_cath_lab_activation: "off",
 *     ...
 *   }
 *
 * The nested branches remain authoritative on read (migrateToV11 prefers them
 * over the flat aliases). The flat aliases are dropped from disk the moment
 * the engine ships its pathway-aware reader.
 */
function withEngineCompat(config: ProtocolConfigV11): Record<string, unknown> {
  const flatAliases = denormalizeStandingOrders(config.standing_orders);
  return {
    ...config,
    standing_orders: {
      ...config.standing_orders,
      ...flatAliases,
    },
  };
}

/** Insert a new versioned protocol_configs row; returns its id or an error. */
async function insertConfigVersion(
  supabase: ReturnType<typeof createClient>,
  ctx: Extract<CustomerContext, { status: "ok" }>,
  config: ProtocolConfigV11,
  version: number,
): Promise<{ id: string } | { error: string }> {
  const { data, error } = await supabase
    .from("protocol_configs")
    .insert({
      customer_id: ctx.activeCustomerId,
      engine_slug: CANONICAL_SLUG,
      config_json: withEngineCompat(config),
      version,
      effective_from: new Date().toISOString(),
      created_by: ctx.userId,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "insert returned no row" };
  }
  return { id: data.id as string };
}

/**
 * Validate the proposed config and publish a new versioned row — UNLESS the
 * clinical_overrides section changed, in which case the change is staged for
 * medical-reviewer approval (see {@link stageClinicalOverride}) and only the
 * non-clinical sections publish normally.
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
  const prevVersion = await currentVersion(supabase, ctx.activeCustomerId);
  const nextVersion = prevVersion + 1;

  // Resolve the currently-published config to diff against.
  const { data: existingRow } = await supabase
    .from("protocol_configs")
    .select("config_json")
    .eq("customer_id", ctx.activeCustomerId)
    .eq("engine_slug", CANONICAL_SLUG)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const current = migrateToV11(
    existingRow?.config_json,
    next.branding.slug,
    next.branding.customer_name,
  );

  // Governance gate: clinical_overrides edits route to the review queue.
  if (clinicalOverridesChanged(current, next)) {
    return stageClinicalOverride(supabase, ctx, current, next, nextVersion);
  }

  const inserted = await insertConfigVersion(supabase, ctx, next, nextVersion);
  if ("error" in inserted) {
    console.error("[config/_actions] publish insert failed:", inserted.error);
    return { status: "error", errors: [`Could not publish: ${inserted.error}`] };
  }

  await writeAuditEvent({
    customerId: ctx.activeCustomerId,
    userId: ctx.userId,
    eventType: "protocol_config.published",
    resourceType: "protocol_configs",
    resourceId: inserted.id,
    payload: {
      version: nextVersion,
      engine_slug: CANONICAL_SLUG,
      changed_sections: changedSections(current, next),
    },
  });

  // Engine loader reads the most-recent row — refresh cached routes.
  revalidatePath("/dashboard/admin/config");
  revalidatePath("/dashboard/engines", "layout");

  return { status: "published", version: nextVersion };
}

/**
 * Stage a clinical_overrides edit for medical-reviewer approval.
 *
 * - Publishes the NON-clinical sections (if any changed) as a new
 *   protocol_configs version, holding clinical_overrides at the current value.
 * - Inserts a `clinical_override_proposals` row with the proposed override JSON.
 * - Writes audit events for both the publish (if any) and the proposal.
 */
async function stageClinicalOverride(
  supabase: ReturnType<typeof createClient>,
  ctx: Extract<CustomerContext, { status: "ok" }>,
  current: ProtocolConfigV11,
  next: ProtocolConfigV11,
  nextVersion: number,
): Promise<PublishResult> {
  // Non-clinical sections published with clinical_overrides held at current.
  const nonClinical: ProtocolConfigV11 = {
    ...next,
    clinical_overrides: current.clinical_overrides,
  };
  const nonClinicalChanged =
    JSON.stringify(nonClinical) !== JSON.stringify(current);

  let publishedVersion: number | null = null;
  if (nonClinicalChanged) {
    const inserted = await insertConfigVersion(
      supabase,
      ctx,
      nonClinical,
      nextVersion,
    );
    if ("error" in inserted) {
      console.error(
        "[config/_actions] non-clinical publish failed:",
        inserted.error,
      );
      return {
        status: "error",
        errors: [`Could not publish non-clinical changes: ${inserted.error}`],
      };
    }
    publishedVersion = nextVersion;
    await writeAuditEvent({
      customerId: ctx.activeCustomerId,
      userId: ctx.userId,
      eventType: "protocol_config.published",
      resourceType: "protocol_configs",
      resourceId: inserted.id,
      payload: {
        version: nextVersion,
        engine_slug: CANONICAL_SLUG,
        changed_sections: changedSections(current, nonClinical),
        note: "non-clinical sections; clinical_overrides staged separately",
      },
    });
  }

  // Stage the clinical override for review.
  const { data: proposal, error: propErr } = await supabase
    .from("clinical_override_proposals")
    .insert({
      customer_id: ctx.activeCustomerId,
      engine_slug: CANONICAL_SLUG,
      proposed_clinical_overrides: next.clinical_overrides,
      proposed_by: ctx.userId,
    })
    .select("id")
    .single();

  if (propErr || !proposal) {
    console.error(
      "[config/_actions] proposal insert failed:",
      propErr?.message,
    );
    return {
      status: "error",
      errors: [
        `Could not stage clinical override: ${propErr?.message ?? "no row returned"}`,
      ],
    };
  }
  const proposalId = proposal.id as string;

  await writeAuditEvent({
    customerId: ctx.activeCustomerId,
    userId: ctx.userId,
    eventType: "protocol_config.override_proposed",
    resourceType: "clinical_override_proposals",
    resourceId: proposalId,
    payload: {
      engine_slug: CANONICAL_SLUG,
      before: current.clinical_overrides,
      after: next.clinical_overrides,
      published_version: publishedVersion,
    },
  });

  revalidatePath("/dashboard/admin/config");
  revalidatePath("/dashboard/admin/reviews");
  if (nonClinicalChanged) revalidatePath("/dashboard/engines", "layout");

  return {
    status: "staged_for_review",
    proposal_id: proposalId,
    published_version: publishedVersion,
    message:
      "Clinical override staged for medical-reviewer approval. Other config changes published normally.",
  };
}
