/**
 * Canonical v1.1 protocol-config schema — the single source of truth for the
 * customer-admin config editor (Sprint 5) and the engine config injection
 * (Sprint 2).
 *
 * A `protocol_configs` row stores a `config_json` blob shaped like
 * {@link ProtocolConfigV11}. The editor reads the most-recent published row,
 * lets a customer admin edit the sections below, validates against this schema,
 * and publishes a new versioned row. The engine loader (Sprint 2) reads the
 * same `config_json` and injects it into the iframe.
 *
 * Legacy rows may predate v1.1 (e.g. the minimal `defaultEngineConfig` shape).
 * {@link migrateToV11} coerces any unknown blob into a complete v1.1 object by
 * filling missing sections with defaults, so the editor always has a full form
 * to render and the validator always sees every field.
 */

export const SCHEMA_VERSION = "1.1" as const;

// ---------------------------------------------------------------------------
// Section types
// ---------------------------------------------------------------------------

export type AttendingNaming = "attending" | "consultant" | "physician";

/**
 * Customer identity — the SHARED key path the engine reads to surface the
 * tenant tag (`m-tenant-banner` in `index.html`), pre-fill the `m-org` field,
 * and capture `S.tenantSlug` / `S.tenantName` into Supabase rows.
 *
 * The engine (`aiwizn-clinical-engine/index.html`) calls
 * `_aiwiznTenantDisplayName(cfg) = cfg.customer.name || humanize(cfg.customer.slug)`
 * — if this top-level `customer` object is absent, the engine falls back to
 * the default "AIWIZN Demo Hospital" tag even when `branding.customer_name`
 * is set. Added 2026-06-21 to fix the per-tenant short-link bug where
 * /allegheny / /unc / /duke were showing the default tag.
 */
export interface CustomerConfig {
  /** Customer legal / display name as it should appear in the engine UI. */
  name: string;
  /** Tenant slug — matches branding.slug. Engine humanizes this if name absent. */
  slug: string;
  /**
   * Email domains we treat as "belongs to this tenant" for the engine's
   * cohort-link auto-routing. Empty array = no domain routing. The engine
   * reads this in `_aiwiznTenantFromEmail()` (Sprint 12).
   */
  email_domains: string[];
}

export interface BrandingConfig {
  /** Customer / org legal name. */
  customer_name: string;
  /** Tenant slug — immutable, read-only in the UI. */
  slug: string;
  logo_url: string;
  /** Hex accent color, e.g. "#00A87A". */
  accent_color: string;
  /**
   * V1.1 spec key (matches the clinical engine). Older rows may still carry the
   * legacy short-form `hospital_display_name` — see {@link migrateToV11}.
   */
  hospital_name_display: string;
  attending_naming: AttendingNaming;
}

/**
 * Timing targets — V1.1 long-form keys, matching the clinical engine and the
 * `multitenancy/README.md` spec. Note: `sepsis_bundle_hr` is in HOURS (1 or 3),
 * not minutes, to align with SEP-1 / Surviving Sepsis bundle conventions.
 */
export interface TimingsConfig {
  door_to_ecg_min: number;
  stemi_door_to_balloon_min: number;
  stroke_door_to_needle_min: number;
  stroke_door_to_ct_min: number;
  sepsis_bundle_hr: number;
  stroke_door_to_device_min: number;
}

/**
 * Standing-orders schema — Sprint 7
 * ---------------------------------
 * Orders are grouped by clinical pathway (STEMI / Stroke / Sepsis / General).
 * Each within-pathway list is anchored to a recognized framework:
 *   • STEMI    — AHA Get-With-The-Guidelines delegation set
 *   • Stroke   — AHA / ASA stroke-alert delegation
 *   • Sepsis   — IHI 1-hour bundle / Surviving Sepsis
 *   • General  — pathway-agnostic delegations (renal adjustments, escalation)
 *
 * Each order carries a ternary mode (Sprint 6 carryover):
 *   • "off"             — order is disabled
 *   • "on"              — order may be executed by the delegated role
 *   • "parallel_notify" — order may be executed AND a notify is sent to the
 *     supervising clinician in parallel
 *
 * The clinical engine has not yet migrated to the nested shape (Sprint 7.1
 * engine-side work). Until then, {@link denormalizeStandingOrders} flattens
 * the nested values back to the engine's expected top-level keys so the
 * editor can dual-write the same publish round-trip.
 */
export type StandingOrderMode = "off" | "on" | "parallel_notify";

export interface StandingOrderEntry {
  mode: StandingOrderMode;
}

export interface StemiStandingOrders {
  nurse_initiate_aspirin: StandingOrderEntry;
  nurse_cath_lab_activation: StandingOrderEntry;
  nurse_initiate_ecg: StandingOrderEntry;
  nurse_administer_oxygen: StandingOrderEntry;
  nurse_initiate_troponin: StandingOrderEntry;
  pharmacist_dose_heparin: StandingOrderEntry;
}

export interface StrokeStandingOrders {
  nurse_initiate_stroke_alert: StandingOrderEntry;
  nurse_initiate_ct: StandingOrderEntry;
  nurse_administer_oxygen: StandingOrderEntry;
  pharmacist_dispense_tpa: StandingOrderEntry;
}

export interface SepsisStandingOrders {
  nurse_initiate_blood_cultures: StandingOrderEntry;
  nurse_initiate_broad_spectrum_abx: StandingOrderEntry;
  nurse_initiate_lactate: StandingOrderEntry;
  nurse_normal_saline_bolus: StandingOrderEntry;
  pharmacist_dispense_stat_abx_without_cosignature: StandingOrderEntry;
}

export interface GeneralStandingOrders {
  direct_attending_escalation: StandingOrderEntry;
  pharmacist_renal_adjust: StandingOrderEntry;
}

export interface StandingOrdersConfig {
  stemi: StemiStandingOrders;
  stroke: StrokeStandingOrders;
  sepsis: SepsisStandingOrders;
  general: GeneralStandingOrders;
}

export type StandingOrderPathway = keyof StandingOrdersConfig;

/**
 * Terminology overrides — V1.1 keys (no `term_` prefix), matching the engine.
 * The legacy `term_attending` / `term_charge_nurse` fields were dropped: the
 * attending naming is now driven by {@link BrandingConfig.attending_naming} and
 * the charge-nurse term wasn't read by the engine.
 */
export interface TerminologyConfig {
  code_blue: string;
  septic_shock: string;
  interpreter_service: string;
  rapid_response_team: string;
}

export type ScenarioVariant = "standard" | "expanded" | "condensed";
export type ScenarioSet = "core_2026" | "pilot" | "custom";

export interface EngineScenarioOverride {
  variant: ScenarioVariant;
  show_internal_codes: boolean;
  scenario_set: ScenarioSet;
}

/** Per-engine scenario overrides, keyed by the engine slug it applies to. */
export interface ScenarioOverridesConfig {
  clinical: EngineScenarioOverride;
  care_support: EngineScenarioOverride;
}

export interface StaffRoleScope {
  enabled: boolean;
  can_document_vitals: boolean;
  can_assist_adls: boolean;
  can_escalate: boolean;
}

export interface StaffRolesConfig {
  cna: StaffRoleScope;
  pca: StaffRoleScope;
  pct: StaffRoleScope;
}

/**
 * Governance-gated overrides. Edits here do NOT auto-publish — they are staged
 * for medical-reviewer approval (see {@link stageClinicalOverride}).
 */
export interface ClinicalOverridesConfig {
  additional_contraindications: string;
  additional_inclusion_criteria: string;
  sepsis_notes: string;
}

export interface ProtocolConfigV11 {
  schema_version: typeof SCHEMA_VERSION;
  /**
   * Customer identity at the top level — the engine reads `cfg.customer.name`
   * to set the tenant tag and pre-fill the org field. Added 2026-06-21 to
   * match the engine's `defaultConfig.json` shape; without this, per-tenant
   * short links (e.g. /allegheny) fell back to the default tag.
   */
  customer: CustomerConfig;
  branding: BrandingConfig;
  timings: TimingsConfig;
  standing_orders: StandingOrdersConfig;
  terminology: TerminologyConfig;
  scenario_overrides: ScenarioOverridesConfig;
  staff_roles: StaffRolesConfig;
  clinical_overrides: ClinicalOverridesConfig;
}

// ---------------------------------------------------------------------------
// Field metadata — drives the form UI (labels, units, ranges, anchors, tips)
// ---------------------------------------------------------------------------

export const ATTENDING_NAMING_OPTIONS: { value: AttendingNaming; label: string }[] =
  [
    { value: "attending", label: "Attending" },
    { value: "consultant", label: "Consultant (UK/Commonwealth)" },
    { value: "physician", label: "Physician" },
  ];

export type TimingField = {
  key: keyof TimingsConfig;
  label: string;
  unit: string;
  min: number;
  max: number;
  /** Published-guideline anchor shown as a footnote under the input. */
  anchor: string;
};

export const TIMING_FIELDS: TimingField[] = [
  {
    key: "door_to_ecg_min",
    label: "Door-to-ECG",
    unit: "min",
    min: 1,
    max: 60,
    anchor: "ACC/AHA gold standard: ≤10 min from arrival",
  },
  {
    key: "stemi_door_to_balloon_min",
    label: "Door-to-balloon (PCI)",
    unit: "min",
    min: 30,
    max: 240,
    anchor: "AHA gold standard: ≤90 min",
  },
  {
    key: "stroke_door_to_needle_min",
    label: "Door-to-needle (tPA, stroke)",
    unit: "min",
    min: 15,
    max: 180,
    anchor: "AHA/ASA gold standard: ≤60 min (target ≤45)",
  },
  {
    key: "stroke_door_to_ct_min",
    label: "Door-to-CT (stroke imaging)",
    unit: "min",
    min: 5,
    max: 120,
    anchor: "AHA/ASA gold standard: ≤25 min to scan",
  },
  {
    key: "sepsis_bundle_hr",
    label: "Sepsis bundle completion",
    unit: "hr",
    min: 1,
    max: 6,
    anchor: "SEP-1 / Surviving Sepsis: 3-hour bundle (1 hr for severe sepsis/septic shock)",
  },
  {
    key: "stroke_door_to_device_min",
    label: "Door-to-device (thrombectomy)",
    unit: "min",
    min: 30,
    max: 240,
    anchor: "AHA/ASA gold standard: ≤90 min from arrival",
  },
];

export type StandingOrderField = {
  /** Order key within its pathway (typed as string at the array boundary; the
   * concrete pathway interface is what gets validated at runtime). */
  key: string;
  label: string;
  /** Clinical implication shown as a tooltip. */
  tooltip: string;
};

export type PathwayGroup = {
  key: StandingOrderPathway;
  label: string;
  anchor: string;
  orders: StandingOrderField[];
};

export const STANDING_ORDER_GROUPS: PathwayGroup[] = [
  {
    key: "stemi",
    label: "STEMI",
    anchor: "AHA Get-With-The-Guidelines · STEMI delegation",
    orders: [
      {
        key: "nurse_initiate_aspirin",
        label: "Nurse may administer chewable ASA 324 mg",
        tooltip:
          "Permits RN to give aspirin per the ACS standing order absent contraindication (active bleed, documented allergy).",
      },
      {
        key: "nurse_cath_lab_activation",
        label: "Nurse may activate the cath lab",
        tooltip:
          "Allows triage RN to activate the cath lab on EKG-confirmed STEMI, protecting the ≤90 min door-to-balloon target.",
      },
      {
        key: "nurse_initiate_ecg",
        label: "Nurse may obtain 12-lead ECG at triage",
        tooltip:
          "Allows triage RN to capture a 12-lead ECG before a physician order, supporting the ≤10 min door-to-ECG target for chest-pain presentations.",
      },
      {
        key: "nurse_administer_oxygen",
        label: "Nurse may administer oxygen (titrated to SpO₂ ≥ 90%)",
        tooltip:
          "Permits RN-initiated supplemental O₂ for hypoxemic STEMI per the ACS standing order.",
      },
      {
        key: "nurse_initiate_troponin",
        label: "Nurse may draw troponin on chest-pain protocol",
        tooltip:
          "Permits RN-initiated troponin draw under the chest-pain standing order, shortening time to first biomarker result.",
      },
      {
        key: "pharmacist_dose_heparin",
        label: "Pharmacist may dose weight-based heparin",
        tooltip:
          "Delegates weight-based heparin dosing and titration to pharmacy per the anticoagulation protocol.",
      },
    ],
  },
  {
    key: "stroke",
    label: "Stroke",
    anchor: "AHA / ASA · stroke-alert delegation",
    orders: [
      {
        key: "nurse_initiate_stroke_alert",
        label: "Nurse may initiate stroke-alert",
        tooltip:
          "Allows RN to call a stroke alert on positive LAMS/Cincinnati screen, mobilizing the team in parallel with physician evaluation.",
      },
      {
        key: "nurse_initiate_ct",
        label: "Nurse may transport directly to CT",
        tooltip:
          "Permits RN to move the patient to non-contrast head CT on stroke-alert, supporting the ≤25 min door-to-CT target.",
      },
      {
        key: "nurse_administer_oxygen",
        label: "Nurse may administer oxygen (titrated to SpO₂ ≥ 94%)",
        tooltip:
          "Permits RN-initiated O₂ for hypoxemic stroke presentations per AHA/ASA standing order.",
      },
      {
        key: "pharmacist_dispense_tpa",
        label: "Pharmacist may dispense weight-based alteplase",
        tooltip:
          "Delegates alteplase preparation and dispense to pharmacy once eligibility is confirmed by the treating physician.",
      },
    ],
  },
  {
    key: "sepsis",
    label: "Sepsis",
    anchor: "IHI 1-hour bundle / Surviving Sepsis",
    orders: [
      {
        key: "nurse_initiate_blood_cultures",
        label: "Nurse may obtain blood cultures",
        tooltip:
          "Allows RN to draw cultures BEFORE antibiotics on a positive sepsis screen, protecting the 1-hour bundle.",
      },
      {
        key: "nurse_initiate_broad_spectrum_abx",
        label: "Nurse may initiate broad-spectrum antibiotics",
        tooltip:
          "Permits RN to start the first dose of broad-spectrum antibiotics once cultures are drawn, per the sepsis standing order.",
      },
      {
        key: "nurse_initiate_lactate",
        label: "Nurse may draw lactate",
        tooltip:
          "Allows RN-initiated lactate draw on positive sepsis screen, supporting the 1-hour bundle window.",
      },
      {
        key: "nurse_normal_saline_bolus",
        label: "Nurse may start 30 mL/kg NS bolus",
        tooltip:
          "Permits RN-initiated crystalloid resuscitation per the sepsis standing order. Use caution in CHF / ESRD — see clinical overrides.",
      },
      {
        key: "pharmacist_dispense_stat_abx_without_cosignature",
        label: "Pharmacist may dispense STAT antibiotics without co-signature",
        tooltip:
          "Delegates STAT antibiotic dispense to pharmacy on sepsis alerts without waiting for physician co-signature.",
      },
    ],
  },
  {
    key: "general",
    label: "General",
    anchor: "Pathway-agnostic delegations",
    orders: [
      {
        key: "direct_attending_escalation",
        label: "Direct attending escalation (skip resident layer)",
        tooltip:
          "Allows RN to escalate directly to the attending on clinical deterioration without paging the resident first.",
      },
      {
        key: "pharmacist_renal_adjust",
        label: "Pharmacist may renally adjust anticoagulants",
        tooltip:
          "Permits pharmacy to adjust anticoagulant dosing for renal function without a new physician order.",
      },
    ],
  },
];

/** Flat list — convenient when a consumer needs every (pathway, key) pair. */
export const STANDING_ORDER_FIELDS: {
  pathway: StandingOrderPathway;
  key: string;
  label: string;
  tooltip: string;
}[] = STANDING_ORDER_GROUPS.flatMap((g) =>
  g.orders.map((o) => ({
    pathway: g.key,
    key: o.key,
    label: o.label,
    tooltip: o.tooltip,
  })),
);

export const STANDING_ORDER_MODE_OPTIONS: {
  value: StandingOrderMode;
  label: string;
  hint: string;
}[] = [
  { value: "off", label: "Off", hint: "Disabled — physician order required." },
  { value: "on", label: "On", hint: "Delegated role may execute the order." },
  {
    value: "parallel_notify",
    label: "Parallel notify",
    hint: "Delegated role executes AND notifies the supervising clinician.",
  },
];

export type TerminologyField = {
  key: keyof TerminologyConfig;
  label: string;
  /** Default English term, shown as the input placeholder. */
  default: string;
};

export const TERMINOLOGY_FIELDS: TerminologyField[] = [
  { key: "code_blue", label: "Cardiac arrest call", default: "Code Blue" },
  { key: "septic_shock", label: "Septic shock", default: "Septic Shock" },
  {
    key: "interpreter_service",
    label: "Interpreter service",
    default: "Interpreter Services",
  },
  {
    key: "rapid_response_team",
    label: "Rapid response team",
    default: "Rapid Response",
  },
];

export const SCENARIO_VARIANT_OPTIONS: { value: ScenarioVariant; label: string }[] =
  [
    { value: "standard", label: "Standard" },
    { value: "expanded", label: "Expanded" },
    { value: "condensed", label: "Condensed" },
  ];

export const SCENARIO_SET_OPTIONS: { value: ScenarioSet; label: string }[] = [
  { value: "core_2026", label: "Core 2026" },
  { value: "pilot", label: "Pilot" },
  { value: "custom", label: "Custom" },
];

export const SCENARIO_ENGINES: { key: keyof ScenarioOverridesConfig; label: string }[] =
  [
    { key: "clinical", label: "Clinical Engine" },
    { key: "care_support", label: "Care Support" },
  ];

export const STAFF_ROLES: { key: keyof StaffRolesConfig; label: string; expand: string }[] =
  [
    { key: "cna", label: "CNA", expand: "Certified Nursing Assistant" },
    { key: "pca", label: "PCA", expand: "Patient Care Assistant" },
    { key: "pct", label: "PCT", expand: "Patient Care Technician" },
  ];

export const STAFF_SCOPE_FIELDS: { key: keyof StaffRoleScope; label: string }[] = [
  { key: "can_document_vitals", label: "Document vital signs" },
  { key: "can_assist_adls", label: "Assist with ADLs" },
  { key: "can_escalate", label: "Escalate to RN / rapid response" },
];

// ---------------------------------------------------------------------------
// Defaults + migration
// ---------------------------------------------------------------------------

function defaultStaffScope(): StaffRoleScope {
  return {
    enabled: true,
    can_document_vitals: true,
    can_assist_adls: true,
    can_escalate: false,
  };
}

/**
 * Canonical seed for a fresh standing-orders config. Most orders default to
 * "on" so the engine has a useful baseline to demonstrate; high-acuity
 * delegations that some sites want gated (parallel_notify) start at "off".
 */
function defaultStandingOrders(): StandingOrdersConfig {
  // Fresh entry objects per key — sharing a single { mode: "on" } reference
  // across keys would leak any later mutation across fields. The codebase
  // treats config as immutable, but defaultStandingOrders is the seed for
  // editor state and provisioned customers, so the cost of a few extra object
  // literals is worth the safety.
  const on = (): StandingOrderEntry => ({ mode: "on" });
  const off = (): StandingOrderEntry => ({ mode: "off" });
  return {
    stemi: {
      nurse_initiate_aspirin: on(),
      nurse_cath_lab_activation: off(),
      nurse_initiate_ecg: on(),
      nurse_administer_oxygen: on(),
      nurse_initiate_troponin: off(),
      pharmacist_dose_heparin: on(),
    },
    stroke: {
      nurse_initiate_stroke_alert: on(),
      nurse_initiate_ct: off(),
      nurse_administer_oxygen: on(),
      pharmacist_dispense_tpa: off(),
    },
    sepsis: {
      nurse_initiate_blood_cultures: on(),
      nurse_initiate_broad_spectrum_abx: off(),
      nurse_initiate_lactate: on(),
      nurse_normal_saline_bolus: off(),
      pharmacist_dispense_stat_abx_without_cosignature: off(),
    },
    general: {
      direct_attending_escalation: off(),
      pharmacist_renal_adjust: on(),
    },
  };
}

function defaultEngineScenario(): EngineScenarioOverride {
  return {
    variant: "standard",
    show_internal_codes: false,
    scenario_set: "core_2026",
  };
}

/** A complete, valid v1.1 config seeded with safe defaults. */
export function defaultProtocolConfig(
  slug = "demo-hospital",
  customerName = "AIWIZN Demo Hospital",
): ProtocolConfigV11 {
  return {
    schema_version: SCHEMA_VERSION,
    // Top-level customer block — engine reads this to set the tenant tag
    // (`_aiwiznTenantDisplayName` in `aiwizn-clinical-engine/index.html`).
    // MUST be present for per-tenant short links to surface tenant branding;
    // without it the engine falls back to "AIWIZN Demo Hospital".
    customer: {
      name: customerName,
      slug,
      email_domains: [],
    },
    branding: {
      customer_name: customerName,
      slug,
      logo_url: "",
      accent_color: "#00A87A",
      hospital_name_display: customerName,
      attending_naming: "attending",
    },
    timings: {
      door_to_ecg_min: 10,
      stemi_door_to_balloon_min: 90,
      stroke_door_to_needle_min: 60,
      stroke_door_to_ct_min: 25,
      sepsis_bundle_hr: 3,
      stroke_door_to_device_min: 90,
    },
    standing_orders: defaultStandingOrders(),
    terminology: {
      code_blue: "Code Blue",
      septic_shock: "Septic Shock",
      interpreter_service: "Interpreter Services",
      rapid_response_team: "Rapid Response",
    },
    scenario_overrides: {
      clinical: defaultEngineScenario(),
      care_support: defaultEngineScenario(),
    },
    staff_roles: {
      cna: defaultStaffScope(),
      pca: defaultStaffScope(),
      pct: defaultStaffScope(),
    },
    clinical_overrides: {
      additional_contraindications: "",
      additional_inclusion_criteria: "",
      sepsis_notes: "",
    },
  };
}

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

const STANDING_ORDER_MODES: readonly StandingOrderMode[] = [
  "off",
  "on",
  "parallel_notify",
];

/**
 * Pull a single order entry out of a stored blob.
 *
 * Three shapes are recognized:
 *   1. Nested + new: `{ stemi: { nurse_initiate_aspirin: { mode: "on" } } }`
 *   2. Nested + boolean: `{ stemi: { nurse_initiate_aspirin: true } }`
 *      (transient state during the editor refactor)
 *   3. Flat legacy:    `{ standing_orders: { nurse_initiate_ecg: true } }`
 *
 * For (3), the raw flat object is passed in as `flat` and looked up by key.
 * For all shapes, an unknown value falls back to `fallback`.
 */
function readOrderEntry(
  pathwayValue: unknown,
  key: string,
  flat: Record<string, unknown> | undefined,
  fallback: StandingOrderEntry,
): StandingOrderEntry {
  // Try nested-new first.
  if (isRecord(pathwayValue) && key in pathwayValue) {
    const v = pathwayValue[key];
    if (isRecord(v) && typeof v.mode === "string") {
      const m = v.mode as StandingOrderMode;
      if (STANDING_ORDER_MODES.includes(m)) return { mode: m };
    }
    // Transient boolean during refactor.
    if (typeof v === "boolean") return { mode: v ? "on" : "off" };
  }
  // Flat legacy fallback.
  if (flat && key in flat) {
    const v = flat[key];
    if (typeof v === "boolean") return { mode: v ? "on" : "off" };
    if (isRecord(v) && typeof v.mode === "string") {
      const m = v.mode as StandingOrderMode;
      if (STANDING_ORDER_MODES.includes(m)) return { mode: m };
    }
  }
  return fallback;
}

/**
 * Translate a stored `standing_orders` blob to the v1.1 nested shape.
 *
 * Old flat keys map to their natural pathway as follows (Sprint 6.2 → 7):
 *   nurse_initiate_ecg          → stemi.nurse_initiate_ecg
 *   nurse_initiate_troponin     → stemi.nurse_initiate_troponin
 *   nurse_administer_aspirin    → stemi.nurse_initiate_aspirin (renamed)
 *   pharmacist_dose_heparin     → stemi.pharmacist_dose_heparin
 *   nurse_initiate_sepsis_bundle → sepsis.nurse_initiate_blood_cultures + nurse_initiate_lactate
 *                                  (the legacy single toggle covered both)
 *   nurse_normal_saline_bolus   → sepsis.nurse_normal_saline_bolus
 *   pharmacist_renal_adjust     → general.pharmacist_renal_adjust
 *
 * Newly-introduced orders (cath-lab activation, stroke alert, broad-spectrum
 * abx, …) take the default seed value when no prior data exists for them.
 */
function migrateStandingOrders(
  so: Record<string, unknown>,
  base: StandingOrdersConfig,
): StandingOrdersConfig {
  // If the blob is already nested, treat it as authoritative. The flat-legacy
  // map (`flat`) is the FULL flat object; we only fall back to it for keys the
  // nested object doesn't carry.
  const hasNested =
    isRecord(so.stemi) ||
    isRecord(so.stroke) ||
    isRecord(so.sepsis) ||
    isRecord(so.general);

  const flat: Record<string, unknown> | undefined = hasNested ? undefined : so;
  const flatNarrow = flat;

  // Legacy `nurse_initiate_sepsis_bundle` was a single toggle that gated both
  // blood cultures and lactate draws — splitting it across both nested keys
  // preserves the operator's intent rather than dropping the value.
  const sepsisBundleLegacy: StandingOrderEntry | null =
    flatNarrow && typeof flatNarrow.nurse_initiate_sepsis_bundle === "boolean"
      ? {
          mode: (flatNarrow.nurse_initiate_sepsis_bundle as boolean)
            ? "on"
            : "off",
        }
      : null;

  // Legacy `nurse_administer_aspirin` is the same delegation as the new
  // `nurse_initiate_aspirin` key — copy it across so renamed legacy data
  // survives the migration.
  const aspirinLegacyAlias: StandingOrderEntry | null =
    flatNarrow && typeof flatNarrow.nurse_administer_aspirin === "boolean"
      ? {
          mode: (flatNarrow.nurse_administer_aspirin as boolean) ? "on" : "off",
        }
      : null;

  return {
    stemi: {
      nurse_initiate_aspirin: readOrderEntry(
        so.stemi,
        "nurse_initiate_aspirin",
        flatNarrow,
        aspirinLegacyAlias ?? base.stemi.nurse_initiate_aspirin,
      ),
      nurse_cath_lab_activation: readOrderEntry(
        so.stemi,
        "nurse_cath_lab_activation",
        flatNarrow,
        base.stemi.nurse_cath_lab_activation,
      ),
      nurse_initiate_ecg: readOrderEntry(
        so.stemi,
        "nurse_initiate_ecg",
        flatNarrow,
        base.stemi.nurse_initiate_ecg,
      ),
      nurse_administer_oxygen: readOrderEntry(
        so.stemi,
        "nurse_administer_oxygen",
        flatNarrow,
        base.stemi.nurse_administer_oxygen,
      ),
      nurse_initiate_troponin: readOrderEntry(
        so.stemi,
        "nurse_initiate_troponin",
        flatNarrow,
        base.stemi.nurse_initiate_troponin,
      ),
      pharmacist_dose_heparin: readOrderEntry(
        so.stemi,
        "pharmacist_dose_heparin",
        flatNarrow,
        base.stemi.pharmacist_dose_heparin,
      ),
    },
    stroke: {
      nurse_initiate_stroke_alert: readOrderEntry(
        so.stroke,
        "nurse_initiate_stroke_alert",
        flatNarrow,
        base.stroke.nurse_initiate_stroke_alert,
      ),
      nurse_initiate_ct: readOrderEntry(
        so.stroke,
        "nurse_initiate_ct",
        flatNarrow,
        base.stroke.nurse_initiate_ct,
      ),
      nurse_administer_oxygen: readOrderEntry(
        so.stroke,
        "nurse_administer_oxygen",
        flatNarrow,
        base.stroke.nurse_administer_oxygen,
      ),
      pharmacist_dispense_tpa: readOrderEntry(
        so.stroke,
        "pharmacist_dispense_tpa",
        flatNarrow,
        base.stroke.pharmacist_dispense_tpa,
      ),
    },
    sepsis: {
      nurse_initiate_blood_cultures: readOrderEntry(
        so.sepsis,
        "nurse_initiate_blood_cultures",
        flatNarrow,
        sepsisBundleLegacy ?? base.sepsis.nurse_initiate_blood_cultures,
      ),
      nurse_initiate_broad_spectrum_abx: readOrderEntry(
        so.sepsis,
        "nurse_initiate_broad_spectrum_abx",
        flatNarrow,
        base.sepsis.nurse_initiate_broad_spectrum_abx,
      ),
      nurse_initiate_lactate: readOrderEntry(
        so.sepsis,
        "nurse_initiate_lactate",
        flatNarrow,
        sepsisBundleLegacy ?? base.sepsis.nurse_initiate_lactate,
      ),
      nurse_normal_saline_bolus: readOrderEntry(
        so.sepsis,
        "nurse_normal_saline_bolus",
        flatNarrow,
        base.sepsis.nurse_normal_saline_bolus,
      ),
      pharmacist_dispense_stat_abx_without_cosignature: readOrderEntry(
        so.sepsis,
        "pharmacist_dispense_stat_abx_without_cosignature",
        flatNarrow,
        base.sepsis.pharmacist_dispense_stat_abx_without_cosignature,
      ),
    },
    general: {
      direct_attending_escalation: readOrderEntry(
        so.general,
        "direct_attending_escalation",
        flatNarrow,
        base.general.direct_attending_escalation,
      ),
      pharmacist_renal_adjust: readOrderEntry(
        so.general,
        "pharmacist_renal_adjust",
        flatNarrow,
        base.general.pharmacist_renal_adjust,
      ),
    },
  };
}

/**
 * Engine-facing flat shape — denormalized from the nested config.
 *
 * The clinical engine (Sprint 6 era) still reads top-level boolean / mode keys
 * on `standing_orders`. Until the engine ships its own pathway-aware
 * representation (Sprint 7.1 engine repo work), the editor dual-writes both
 * shapes on publish: the nested object stays authoritative, and these flat
 * keys ride alongside so the engine continues to behave.
 *
 * Rules:
 *   • Cross-pathway duplicates (e.g. `nurse_administer_oxygen` lives under both
 *     stemi and stroke) collapse to a single flat key using the strongest mode
 *     across the pathways (parallel_notify > on > off).
 *   • Legacy compound keys the engine still reads (`nurse_initiate_sepsis_bundle`)
 *     mirror the strongest mode of any contributing nested key.
 */
export function denormalizeStandingOrders(
  s: StandingOrdersConfig,
): Record<string, StandingOrderMode> {
  const flat: Record<string, StandingOrderMode> = {};
  const max = (a: StandingOrderMode, b: StandingOrderMode): StandingOrderMode => {
    const rank: Record<StandingOrderMode, number> = {
      off: 0,
      on: 1,
      parallel_notify: 2,
    };
    return rank[a] >= rank[b] ? a : b;
  };
  const put = (k: string, m: StandingOrderMode) => {
    flat[k] = flat[k] ? max(flat[k], m) : m;
  };
  for (const group of Object.values(s) as Record<string, StandingOrderEntry>[]) {
    for (const [k, v] of Object.entries(group)) {
      put(k, v.mode);
    }
  }
  // Legacy compound the engine still reads — strongest of the two underlying
  // sepsis orders.
  flat.nurse_initiate_sepsis_bundle = max(
    s.sepsis.nurse_initiate_blood_cultures.mode,
    s.sepsis.nurse_initiate_lactate.mode,
  );
  // Legacy alias for the renamed aspirin key.
  flat.nurse_administer_aspirin = s.stemi.nurse_initiate_aspirin.mode;
  return flat;
}

function str(v: unknown, fallback: string): string {
  return typeof v === "string" ? v : fallback;
}
function num(v: unknown, fallback: number): number {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}
function bool(v: unknown, fallback: boolean): boolean {
  return typeof v === "boolean" ? v : fallback;
}
function pick<T extends string>(v: unknown, allowed: readonly T[], fallback: T): T {
  return typeof v === "string" && (allowed as readonly string[]).includes(v)
    ? (v as T)
    : fallback;
}

/**
 * Coerce any stored/unknown config blob into a complete v1.1 object. Missing
 * fields fall back to defaults, so the editor always renders a full form and
 * validation always sees every key. Pure (no I/O) — safe on client and server.
 */
export function migrateToV11(
  raw: unknown,
  slug = "demo-hospital",
  customerName = "AIWIZN Demo Hospital",
): ProtocolConfigV11 {
  const base = defaultProtocolConfig(slug, customerName);
  if (!isRecord(raw)) return base;

  const b = isRecord(raw.branding) ? raw.branding : {};
  const t = isRecord(raw.timings) ? raw.timings : {};
  const so = isRecord(raw.standing_orders) ? raw.standing_orders : {};
  const tm = isRecord(raw.terminology) ? raw.terminology : {};
  const sc = isRecord(raw.scenario_overrides) ? raw.scenario_overrides : {};
  const sr = isRecord(raw.staff_roles) ? raw.staff_roles : {};
  const co = isRecord(raw.clinical_overrides) ? raw.clinical_overrides : {};

  const engineScenario = (v: unknown): EngineScenarioOverride => {
    const r = isRecord(v) ? v : {};
    return {
      variant: pick(r.variant, ["standard", "expanded", "condensed"], "standard"),
      show_internal_codes: bool(r.show_internal_codes, false),
      scenario_set: pick(r.scenario_set, ["core_2026", "pilot", "custom"], "core_2026"),
    };
  };

  const staffScope = (v: unknown, d: StaffRoleScope): StaffRoleScope => {
    const r = isRecord(v) ? v : {};
    return {
      enabled: bool(r.enabled, d.enabled),
      can_document_vitals: bool(r.can_document_vitals, d.can_document_vitals),
      can_assist_adls: bool(r.can_assist_adls, d.can_assist_adls),
      can_escalate: bool(r.can_escalate, d.can_escalate),
    };
  };

  // Sepsis legacy fallback: editor used to write `sepsis_bundle_min` in minutes
  // (60 or 180). Convert to hours when only the legacy key is present.
  const sepsisLegacyMin = num(t.sepsis_bundle_min, NaN);
  const sepsisLegacyHr = Number.isFinite(sepsisLegacyMin)
    ? Math.round(sepsisLegacyMin / 60)
    : NaN;

  // Top-level customer block — required by the engine's tenant tag.
  const cust = isRecord((raw as Record<string, unknown>).customer)
    ? ((raw as Record<string, unknown>).customer as Record<string, unknown>)
    : {};
  const emailDomains = Array.isArray(cust.email_domains)
    ? (cust.email_domains as unknown[]).filter((d): d is string => typeof d === "string")
    : base.customer.email_domains;

  return {
    schema_version: SCHEMA_VERSION,
    customer: {
      name: customerName || str(cust.name, base.customer.name),
      slug: slug || str(cust.slug, base.customer.slug),
      email_domains: emailDomains,
    },
    branding: {
      // slug/customer_name from the trusted caller take precedence over the blob.
      customer_name: customerName || str(b.customer_name, base.branding.customer_name),
      slug: slug || str(b.slug, base.branding.slug),
      logo_url: str(b.logo_url, base.branding.logo_url),
      accent_color: str(b.accent_color, base.branding.accent_color),
      // V1.1 long-form first; fall back to legacy short-form so older rows still load.
      hospital_name_display: str(
        b.hospital_name_display,
        str(
          b.hospital_display_name,
          customerName || base.branding.hospital_name_display,
        ),
      ),
      attending_naming: pick(
        b.attending_naming,
        ["attending", "consultant", "physician"],
        "attending",
      ),
    },
    timings: {
      door_to_ecg_min: num(t.door_to_ecg_min, base.timings.door_to_ecg_min),
      // V1.1 long-form first; fall back to legacy short-form so older rows still load.
      stemi_door_to_balloon_min: num(
        t.stemi_door_to_balloon_min,
        num(t.door_to_balloon_min, base.timings.stemi_door_to_balloon_min),
      ),
      stroke_door_to_needle_min: num(
        t.stroke_door_to_needle_min,
        num(t.door_to_needle_min, base.timings.stroke_door_to_needle_min),
      ),
      stroke_door_to_ct_min: num(
        t.stroke_door_to_ct_min,
        num(t.door_to_ct_min, base.timings.stroke_door_to_ct_min),
      ),
      // Hours on the engine; legacy editor wrote minutes — convert if needed.
      sepsis_bundle_hr: num(
        t.sepsis_bundle_hr,
        Number.isFinite(sepsisLegacyHr) ? sepsisLegacyHr : base.timings.sepsis_bundle_hr,
      ),
      stroke_door_to_device_min: num(
        t.stroke_door_to_device_min,
        base.timings.stroke_door_to_device_min,
      ),
    },
    standing_orders: migrateStandingOrders(so, base.standing_orders),
    terminology: {
      // V1.1 long-form first; fall back to legacy `term_*` short-form so older
      // rows still load. `term_attending` / `term_charge_nurse` have no V1.1
      // analogue and are dropped on read.
      code_blue: str(tm.code_blue, str(tm.term_code_blue, base.terminology.code_blue)),
      septic_shock: str(tm.septic_shock, base.terminology.septic_shock),
      interpreter_service: str(
        tm.interpreter_service,
        base.terminology.interpreter_service,
      ),
      rapid_response_team: str(
        tm.rapid_response_team,
        str(tm.term_rapid_response, base.terminology.rapid_response_team),
      ),
    },
    scenario_overrides: {
      clinical: engineScenario(sc.clinical),
      care_support: engineScenario(sc.care_support),
    },
    staff_roles: {
      cna: staffScope(sr.cna, base.staff_roles.cna),
      pca: staffScope(sr.pca, base.staff_roles.pca),
      pct: staffScope(sr.pct, base.staff_roles.pct),
    },
    clinical_overrides: {
      additional_contraindications: str(
        co.additional_contraindications,
        base.clinical_overrides.additional_contraindications,
      ),
      additional_inclusion_criteria: str(
        co.additional_inclusion_criteria,
        base.clinical_overrides.additional_inclusion_criteria,
      ),
      sepsis_notes: str(co.sepsis_notes, base.clinical_overrides.sepsis_notes),
    },
  };
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export type ValidationResult =
  | { ok: true; config: ProtocolConfigV11 }
  | { ok: false; errors: string[] };

const HEX_RE = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

/**
 * Validate a v1.1 config: schema_version, required fields, value types, and
 * sensible ranges for timing targets. Returns the typed config on success or a
 * list of human-readable errors. Defensive — accepts `unknown`.
 */
export function validateProtocolConfig(raw: unknown): ValidationResult {
  const errors: string[] = [];

  if (!isRecord(raw)) {
    return { ok: false, errors: ["Config is not an object."] };
  }
  if (raw.schema_version !== SCHEMA_VERSION) {
    errors.push(`schema_version must be "${SCHEMA_VERSION}".`);
  }

  const b = isRecord(raw.branding) ? raw.branding : null;
  if (!b) {
    errors.push("Missing branding section.");
  } else {
    if (typeof b.customer_name !== "string" || b.customer_name.trim() === "")
      errors.push("Branding: customer name is required.");
    if (typeof b.slug !== "string" || b.slug.trim() === "")
      errors.push("Branding: slug is required.");
    if (typeof b.accent_color !== "string" || !HEX_RE.test(b.accent_color))
      errors.push("Branding: accent color must be a hex value like #00A87A.");
    if (
      b.attending_naming !== "attending" &&
      b.attending_naming !== "consultant" &&
      b.attending_naming !== "physician"
    )
      errors.push("Branding: attending naming is invalid.");
  }

  const t = isRecord(raw.timings) ? raw.timings : null;
  if (!t) {
    errors.push("Missing timings section.");
  } else {
    for (const f of TIMING_FIELDS) {
      const v = t[f.key];
      if (typeof v !== "number" || !Number.isFinite(v)) {
        errors.push(`Timings: ${f.label} must be a number.`);
      } else if (!Number.isInteger(v)) {
        errors.push(`Timings: ${f.label} must be a whole number of minutes.`);
      } else if (v < f.min || v > f.max) {
        errors.push(`Timings: ${f.label} must be between ${f.min} and ${f.max} ${f.unit}.`);
      }
    }
  }

  const so = isRecord(raw.standing_orders) ? raw.standing_orders : null;
  if (!so) {
    errors.push("Missing standing_orders section.");
  } else {
    for (const group of STANDING_ORDER_GROUPS) {
      const pathwayVal = so[group.key];
      const pathway = isRecord(pathwayVal) ? pathwayVal : null;
      if (!pathway) {
        errors.push(`Standing orders: missing ${group.label} pathway.`);
        continue;
      }
      for (const order of group.orders) {
        const entry = pathway[order.key];
        if (!isRecord(entry)) {
          errors.push(
            `Standing orders: ${group.label} · "${order.label}" must be an object.`,
          );
          continue;
        }
        if (
          typeof entry.mode !== "string" ||
          !["off", "on", "parallel_notify"].includes(entry.mode)
        ) {
          errors.push(
            `Standing orders: ${group.label} · "${order.label}" mode is invalid.`,
          );
        }
      }
    }
  }

  const tm = isRecord(raw.terminology) ? raw.terminology : null;
  if (!tm) {
    errors.push("Missing terminology section.");
  } else {
    for (const f of TERMINOLOGY_FIELDS) {
      if (typeof tm[f.key] !== "string")
        errors.push(`Terminology: ${f.label} must be text.`);
    }
  }

  const sc = isRecord(raw.scenario_overrides) ? raw.scenario_overrides : null;
  if (!sc) {
    errors.push("Missing scenario_overrides section.");
  } else {
    for (const e of SCENARIO_ENGINES) {
      const ov = isRecord(sc[e.key]) ? (sc[e.key] as Record<string, unknown>) : null;
      if (!ov) {
        errors.push(`Scenario overrides: missing ${e.label}.`);
        continue;
      }
      if (!["standard", "expanded", "condensed"].includes(ov.variant as string))
        errors.push(`Scenario overrides: ${e.label} variant is invalid.`);
      if (typeof ov.show_internal_codes !== "boolean")
        errors.push(`Scenario overrides: ${e.label} show-internal-codes must be on or off.`);
      if (!["core_2026", "pilot", "custom"].includes(ov.scenario_set as string))
        errors.push(`Scenario overrides: ${e.label} scenario set is invalid.`);
    }
  }

  const sr = isRecord(raw.staff_roles) ? raw.staff_roles : null;
  if (!sr) {
    errors.push("Missing staff_roles section.");
  } else {
    for (const r of STAFF_ROLES) {
      const role = isRecord(sr[r.key]) ? (sr[r.key] as Record<string, unknown>) : null;
      if (!role) {
        errors.push(`Staff roles: missing ${r.label}.`);
        continue;
      }
      if (typeof role.enabled !== "boolean")
        errors.push(`Staff roles: ${r.label} enabled must be on or off.`);
      for (const s of STAFF_SCOPE_FIELDS) {
        if (typeof role[s.key] !== "boolean")
          errors.push(`Staff roles: ${r.label} "${s.label}" must be on or off.`);
      }
    }
  }

  const co = isRecord(raw.clinical_overrides) ? raw.clinical_overrides : null;
  if (!co) {
    errors.push("Missing clinical_overrides section.");
  } else {
    for (const k of [
      "additional_contraindications",
      "additional_inclusion_criteria",
      "sepsis_notes",
    ] as const) {
      if (typeof co[k] !== "string")
        errors.push(`Clinical overrides: ${k} must be text.`);
    }
  }

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, config: raw as unknown as ProtocolConfigV11 };
}

/**
 * True if the clinical_overrides section differs between two configs. Used by
 * the publish flow to route governance-gated edits to the review queue instead
 * of auto-publishing.
 */
export function clinicalOverridesChanged(
  current: ProtocolConfigV11,
  next: ProtocolConfigV11,
): boolean {
  return (
    JSON.stringify(current.clinical_overrides) !==
    JSON.stringify(next.clinical_overrides)
  );
}
