/**
 * Offering × Tenant composition — type contract.
 *
 * See ./README.md for the architecture decision record. This file ships the
 * TypeScript interfaces so the AI Readiness build (next sprint) imports them
 * cleanly. No runtime route changes; the existing per-tenant URLs continue
 * working unchanged.
 *
 * **Frozen-path guarantee:** this module does NOT import from or modify
 * `aiwizn-clinical-engine/index.html`, `defaultConfig.json`, or
 * `cohort-invite.html`. Adding offerings is purely additive on the website
 * side until a new offering URL is registered in the engine repo.
 */

import {
  defaultProtocolConfig,
  type ProtocolConfigV11,
} from "@/lib/protocolConfig";
import {
  demoHospitalConfig,
  uncMedicalCenterConfig,
  dukeUniversityConfig,
  alleghenyHealthNetworkConfig,
} from "@/lib/demoTenantLinks";

// ---------------------------------------------------------------------------
// Offering — what the engine measures
// ---------------------------------------------------------------------------

export type OfferingSlug =
  | "clinical"                    // existing — NWI, STEMI/stroke/sepsis
  | "patient-care-onboarding"     // existing — PCRI, CNA/PCT/PCA scope
  | "ai-readiness"                // Phase 1 build — ARI, RUAIH-aligned scenarios
  | "joint-commission-readiness"; // Phase 2 — JCRI, org-prep variant of AI Readiness

export type ScoringIndex = "NWI" | "PCRI" | "ARI" | "JCRI";

export interface OfferingConfig {
  /** URL slug used in `demo.aiwizn.com/<slug>/`. */
  slug: OfferingSlug;
  /** Display name shown in the engine start-modal banner. */
  name: string;
  /**
   * Engine's `scenario_set` field. The engine selects scenarios based on this.
   * Matches the existing `scenarioSet` strings already used by the engine.
   */
  scenarioSet: string;
  /** The composite index the offering produces at end-of-session. */
  scoringIndex: ScoringIndex;
  /**
   * Default competency domains for this offering — drives the persona render.
   * Each offering can override.
   */
  defaultDomains: readonly string[];
  /**
   * Whether the offering renders the clinical timings panel. AI Readiness +
   * Joint Commission Readiness don't surface D2B/D2N/sepsis-bundle UI;
   * Clinical + PCO do.
   */
  rendersClinicalTimings: boolean;
}

/**
 * Catalogue of known offerings. Add new entries here; the engine reads the
 * resolved config from the URL hash payload and applies overrides.
 */
export const OFFERINGS: Record<OfferingSlug, OfferingConfig> = {
  clinical: {
    slug: "clinical",
    name: "AIWIZN Clinical Engine",
    scenarioSet: "core_2026",
    scoringIndex: "NWI",
    defaultDomains: [
      "D1 · Ambiguity Tolerance",
      "D2 · Therapeutic Communication",
      "D3 · Ethical Reasoning",
      "D4 · Psychological Safety",
      "D5 · Deterioration Recognition",
      "D6 · Pharmacological Safety",
      "D7 · Clinical Handover (SBAR)",
      "D8 · Prioritisation / Triage",
      "D9 · Cultural Humility",
      "D11 · Equity-Aware Care",
      "D12 · Moral Resilience",
    ],
    rendersClinicalTimings: true,
  },
  "patient-care-onboarding": {
    slug: "patient-care-onboarding",
    name: "AIWIZN Patient Care Onboarding",
    scenarioSet: "pco_2026",
    scoringIndex: "PCRI",
    defaultDomains: [
      "Vitals capture & documentation",
      "ADL support & escalation triggers",
      "Care-support communication",
      "Scope-of-practice boundaries",
      "Safety-event recognition",
    ],
    rendersClinicalTimings: false,
  },
  "ai-readiness": {
    slug: "ai-readiness",
    name: "AIWIZN AI Readiness Engine",
    scenarioSet: "ai_readiness_v1",
    scoringIndex: "ARI",
    defaultDomains: [
      "Governance literacy",
      "Bias recognition",
      "Failure-mode response",
      "Disclosure judgment",
      "Escalation discipline",
    ],
    rendersClinicalTimings: false,
  },
  "joint-commission-readiness": {
    slug: "joint-commission-readiness",
    name: "AIWIZN Joint Commission Readiness",
    scenarioSet: "jc_readiness_v1",
    scoringIndex: "JCRI",
    defaultDomains: [
      "RUAIH governance committee structure",
      "AI risk & bias assessment workflow",
      "Ongoing quality monitoring",
      "Voluntary AI safety-event reporting",
      "Patient privacy & transparency",
      "Staff education evidence",
    ],
    rendersClinicalTimings: false,
  },
} as const;

export function offeringConfigFor(slug: string): OfferingConfig {
  return OFFERINGS[slug as OfferingSlug] ?? OFFERINGS.clinical;
}

// ---------------------------------------------------------------------------
// Tenant — whose protocols + branding render
// ---------------------------------------------------------------------------

export type TenantSlug =
  | "demo-hospital"
  | "wakemed"
  | "unc"
  | "duke"
  | "ahn"
  | string; // custom — "Other (free text)" cohort-builder selection

/**
 * Returns the tenant's `ProtocolConfigV11`. For known tenants this dispatches
 * to the existing exports in `lib/demoTenantLinks.ts`. For unknown slugs it
 * returns a generic `defaultProtocolConfig(slug, customerName)`.
 *
 * WakeMed is intentionally NOT in this dispatch table — WakeMed's config lives
 * in the engine repo and Supabase `protocol_configs`. The website never
 * generates a WakeMed config payload.
 */
export function tenantConfigFor(
  slug: TenantSlug,
  customerName?: string,
): ProtocolConfigV11 {
  switch (slug) {
    case "demo-hospital":
      return demoHospitalConfig();
    case "unc":
      return uncMedicalCenterConfig();
    case "duke":
      return dukeUniversityConfig();
    case "ahn":
      return alleghenyHealthNetworkConfig();
    case "wakemed":
      // WakeMed is engine-resident — never generated here. Return the
      // demo-hospital fallback as a safe default; callers should check the
      // `usesConfigHash` flag in cohort-builder selectors before relying on
      // this for WakeMed.
      return demoHospitalConfig();
    default:
      return defaultProtocolConfig(
        slugify(slug),
        customerName ?? humanize(slug),
      );
  }
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "custom";
}

function humanize(s: string): string {
  return s
    .replace(/[-_]+/g, " ")
    .split(/\s+/)
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : ""))
    .join(" ")
    .trim();
}

// ---------------------------------------------------------------------------
// Composition — offering + tenant → engine-ready config
// ---------------------------------------------------------------------------

/**
 * Compose an offering + tenant into a `ProtocolConfigV11` payload the engine
 * boots from. The offering overrides `scenario_overrides.clinical.scenario_set`
 * and (when `rendersClinicalTimings` is false) zeroes-out the timings UI hint.
 *
 * Returns a new object; never mutates inputs.
 *
 * Phase 1 keeps this simple — the engine accepts the existing
 * `ProtocolConfigV11` shape and an offering-specific scenario_set string is
 * enough to switch what scenarios render. Phase 2 may add `offering` as a
 * top-level field if the engine needs finer hooks.
 */
export function composeConfig(
  offering: OfferingConfig,
  tenant: ProtocolConfigV11,
): ProtocolConfigV11 {
  // `ProtocolConfigV11.scenario_overrides.clinical.scenario_set` is currently
  // typed as the original "core_2026" | "pilot" | "custom" union (Sprint 7
  // clinical-only). The offering architecture extends that catalogue at the
  // engine side without widening the website-side type union yet, so we cast
  // unknown offering scenario sets to "custom" — the engine treats anything
  // it doesn't recognise as a custom override and falls back to the offering's
  // own scenario manifest.
  const scenarioSet = (offering.scenarioSet === "core_2026" ||
    offering.scenarioSet === "pilot" ||
    offering.scenarioSet === "custom")
    ? offering.scenarioSet as "core_2026" | "pilot" | "custom"
    : ("custom" as const);

  return {
    ...tenant,
    scenario_overrides: {
      ...tenant.scenario_overrides,
      clinical: {
        ...tenant.scenario_overrides.clinical,
        scenario_set: scenarioSet,
      },
    },
  };
}
