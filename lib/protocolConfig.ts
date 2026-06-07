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

export interface BrandingConfig {
  /** Customer / org legal name. */
  customer_name: string;
  /** Tenant slug — immutable, read-only in the UI. */
  slug: string;
  logo_url: string;
  /** Hex accent color, e.g. "#00A87A". */
  accent_color: string;
  hospital_display_name: string;
  attending_naming: AttendingNaming;
}

export interface TimingsConfig {
  door_to_ecg_min: number;
  door_to_balloon_min: number;
  door_to_needle_min: number;
  door_to_ct_min: number;
  sepsis_bundle_min: number;
  stroke_door_to_device_min: number;
}

export interface StandingOrdersConfig {
  nurse_initiate_ecg: boolean;
  nurse_initiate_troponin: boolean;
  nurse_administer_aspirin: boolean;
  nurse_initiate_sepsis_bundle: boolean;
  nurse_normal_saline_bolus: boolean;
  pharmacist_dose_heparin: boolean;
  pharmacist_renal_adjust: boolean;
}

export interface TerminologyConfig {
  term_attending: string;
  term_charge_nurse: string;
  term_rapid_response: string;
  term_code_blue: string;
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
    key: "door_to_balloon_min",
    label: "Door-to-balloon (PCI)",
    unit: "min",
    min: 30,
    max: 240,
    anchor: "AHA gold standard: ≤90 min",
  },
  {
    key: "door_to_needle_min",
    label: "Door-to-needle (tPA, stroke)",
    unit: "min",
    min: 15,
    max: 180,
    anchor: "AHA/ASA gold standard: ≤60 min (target ≤45)",
  },
  {
    key: "door_to_ct_min",
    label: "Door-to-CT (stroke imaging)",
    unit: "min",
    min: 5,
    max: 120,
    anchor: "AHA/ASA gold standard: ≤25 min to scan",
  },
  {
    key: "sepsis_bundle_min",
    label: "Sepsis bundle completion",
    unit: "min",
    min: 30,
    max: 360,
    anchor: "SEP-1 / Surviving Sepsis: 3-hour (180 min) bundle",
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
  key: keyof StandingOrdersConfig;
  label: string;
  /** Clinical implication shown as a tooltip. */
  tooltip: string;
};

export const STANDING_ORDER_FIELDS: StandingOrderField[] = [
  {
    key: "nurse_initiate_ecg",
    label: "Nurse may obtain 12-lead ECG at triage",
    tooltip:
      "Allows triage RN to capture a 12-lead ECG before a physician order, supporting the ≤10 min door-to-ECG target for chest-pain presentations.",
  },
  {
    key: "nurse_initiate_troponin",
    label: "Nurse may draw troponin on chest-pain protocol",
    tooltip:
      "Permits RN-initiated troponin draw under the chest-pain standing order, shortening time to first biomarker result.",
  },
  {
    key: "nurse_administer_aspirin",
    label: "Nurse may administer chewable ASA 324 mg",
    tooltip:
      "Permits RN to give aspirin per the ACS standing order absent contraindication (active bleed, documented allergy).",
  },
  {
    key: "nurse_initiate_sepsis_bundle",
    label: "Nurse may initiate lactate + blood cultures on sepsis screen",
    tooltip:
      "Allows RN to draw lactate and obtain cultures before antibiotics on a positive sepsis screen, protecting the 3-hour bundle window.",
  },
  {
    key: "nurse_normal_saline_bolus",
    label: "Nurse may start 30 mL/kg NS bolus (sepsis)",
    tooltip:
      "Permits RN-initiated crystalloid resuscitation per the sepsis standing order. Use caution in CHF / ESRD — see clinical overrides.",
  },
  {
    key: "pharmacist_dose_heparin",
    label: "Pharmacist may dose weight-based heparin",
    tooltip:
      "Delegates weight-based heparin dosing and titration to pharmacy per the anticoagulation protocol.",
  },
  {
    key: "pharmacist_renal_adjust",
    label: "Pharmacist may renally adjust anticoagulants",
    tooltip:
      "Permits pharmacy to adjust anticoagulant dosing for renal function without a new physician order.",
  },
];

export type TerminologyField = {
  key: keyof TerminologyConfig;
  label: string;
  /** Default English term, shown as the input placeholder. */
  default: string;
};

export const TERMINOLOGY_FIELDS: TerminologyField[] = [
  { key: "term_attending", label: "Attending physician", default: "Attending" },
  { key: "term_charge_nurse", label: "Charge nurse", default: "Charge Nurse" },
  { key: "term_rapid_response", label: "Rapid response", default: "Rapid Response" },
  { key: "term_code_blue", label: "Cardiac arrest call", default: "Code Blue" },
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
    branding: {
      customer_name: customerName,
      slug,
      logo_url: "",
      accent_color: "#00A87A",
      hospital_display_name: customerName,
      attending_naming: "attending",
    },
    timings: {
      door_to_ecg_min: 10,
      door_to_balloon_min: 90,
      door_to_needle_min: 60,
      door_to_ct_min: 25,
      sepsis_bundle_min: 180,
      stroke_door_to_device_min: 90,
    },
    standing_orders: {
      nurse_initiate_ecg: true,
      nurse_initiate_troponin: false,
      nurse_administer_aspirin: true,
      nurse_initiate_sepsis_bundle: true,
      nurse_normal_saline_bolus: false,
      pharmacist_dose_heparin: true,
      pharmacist_renal_adjust: true,
    },
    terminology: {
      term_attending: "Attending",
      term_charge_nurse: "Charge Nurse",
      term_rapid_response: "Rapid Response",
      term_code_blue: "Code Blue",
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

  return {
    schema_version: SCHEMA_VERSION,
    branding: {
      // slug/customer_name from the trusted caller take precedence over the blob.
      customer_name: customerName || str(b.customer_name, base.branding.customer_name),
      slug: slug || str(b.slug, base.branding.slug),
      logo_url: str(b.logo_url, base.branding.logo_url),
      accent_color: str(b.accent_color, base.branding.accent_color),
      hospital_display_name: str(
        b.hospital_display_name,
        customerName || base.branding.hospital_display_name,
      ),
      attending_naming: pick(
        b.attending_naming,
        ["attending", "consultant", "physician"],
        "attending",
      ),
    },
    timings: {
      door_to_ecg_min: num(t.door_to_ecg_min, base.timings.door_to_ecg_min),
      door_to_balloon_min: num(t.door_to_balloon_min, base.timings.door_to_balloon_min),
      door_to_needle_min: num(t.door_to_needle_min, base.timings.door_to_needle_min),
      door_to_ct_min: num(t.door_to_ct_min, base.timings.door_to_ct_min),
      sepsis_bundle_min: num(t.sepsis_bundle_min, base.timings.sepsis_bundle_min),
      stroke_door_to_device_min: num(
        t.stroke_door_to_device_min,
        base.timings.stroke_door_to_device_min,
      ),
    },
    standing_orders: {
      nurse_initiate_ecg: bool(so.nurse_initiate_ecg, base.standing_orders.nurse_initiate_ecg),
      nurse_initiate_troponin: bool(
        so.nurse_initiate_troponin,
        base.standing_orders.nurse_initiate_troponin,
      ),
      nurse_administer_aspirin: bool(
        so.nurse_administer_aspirin,
        base.standing_orders.nurse_administer_aspirin,
      ),
      nurse_initiate_sepsis_bundle: bool(
        so.nurse_initiate_sepsis_bundle,
        base.standing_orders.nurse_initiate_sepsis_bundle,
      ),
      nurse_normal_saline_bolus: bool(
        so.nurse_normal_saline_bolus,
        base.standing_orders.nurse_normal_saline_bolus,
      ),
      pharmacist_dose_heparin: bool(
        so.pharmacist_dose_heparin,
        base.standing_orders.pharmacist_dose_heparin,
      ),
      pharmacist_renal_adjust: bool(
        so.pharmacist_renal_adjust,
        base.standing_orders.pharmacist_renal_adjust,
      ),
    },
    terminology: {
      term_attending: str(tm.term_attending, base.terminology.term_attending),
      term_charge_nurse: str(tm.term_charge_nurse, base.terminology.term_charge_nurse),
      term_rapid_response: str(tm.term_rapid_response, base.terminology.term_rapid_response),
      term_code_blue: str(tm.term_code_blue, base.terminology.term_code_blue),
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
    for (const f of STANDING_ORDER_FIELDS) {
      if (typeof so[f.key] !== "boolean")
        errors.push(`Standing orders: "${f.label}" must be on or off.`);
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
