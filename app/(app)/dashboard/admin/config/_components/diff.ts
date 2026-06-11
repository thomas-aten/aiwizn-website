import {
  SCENARIO_ENGINES,
  STAFF_ROLES,
  STAFF_SCOPE_FIELDS,
  STANDING_ORDER_GROUPS,
  TERMINOLOGY_FIELDS,
  TIMING_FIELDS,
  type ProtocolConfigV11,
} from "@/lib/protocolConfig";

/**
 * Hand-rolled, key-level diff between two v1.1 configs. Produces one entry per
 * changed leaf value with a human-readable label and before/after strings for
 * the side-by-side review table. No external dependency — the config shape is
 * fixed and shallow enough to flatten by hand.
 *
 * Sprint 7 — standing_orders moved from flat booleans to nested pathway groups
 * carrying `{ mode }`. The label map now namespaces orders by pathway
 * (`STEMI · Nurse may obtain ECG`) and the diff descends into the inner
 * `.mode` so a single-entry change shows up as one row, not two.
 */

export type DiffEntry = {
  /** Dot-path key, stable for React keys. */
  path: string;
  /** Human-readable field label. */
  label: string;
  before: string;
  after: string;
  /** True for clinical_overrides fields (governance-gated). */
  governance: boolean;
};

export type ConfigDiff = DiffEntry[];

/** Human-friendly rendering for diff values. */
const fmt = (v: unknown): string => {
  if (typeof v === "boolean") return v ? "On" : "Off";
  if (v === "" || v === null || v === undefined) return "—";
  if (typeof v === "string") {
    // Standing-order modes get a short readable form.
    if (v === "off") return "Off";
    if (v === "on") return "On";
    if (v === "parallel_notify") return "On + parallel notify";
  }
  return String(v);
};

/** Build the flat label map once per call (cheap; config is small). */
function buildLabels(): Record<string, string> {
  const m: Record<string, string> = {
    "branding.customer_name": "Customer name",
    "branding.slug": "Slug",
    "branding.logo_url": "Logo URL",
    "branding.accent_color": "Accent color",
    "branding.hospital_name_display": "Hospital display name",
    "branding.attending_naming": "Attending naming",
    "clinical_overrides.additional_contraindications":
      "Additional contraindications",
    "clinical_overrides.additional_inclusion_criteria":
      "Additional inclusion criteria",
    "clinical_overrides.sepsis_notes": "Sepsis notes",
  };
  for (const f of TIMING_FIELDS) m[`timings.${f.key}`] = `${f.label} (${f.unit})`;
  for (const g of STANDING_ORDER_GROUPS) {
    for (const o of g.orders) {
      // Path matches the flattener: standing_orders.<pathway>.<order>.mode
      m[`standing_orders.${g.key}.${o.key}.mode`] = `${g.label} · ${o.label}`;
    }
  }
  for (const f of TERMINOLOGY_FIELDS) m[`terminology.${f.key}`] = f.label;
  for (const e of SCENARIO_ENGINES) {
    m[`scenario_overrides.${e.key}.variant`] = `${e.label} · variant`;
    m[`scenario_overrides.${e.key}.scenario_set`] = `${e.label} · scenario set`;
    m[`scenario_overrides.${e.key}.show_internal_codes`] =
      `${e.label} · show internal codes`;
  }
  for (const r of STAFF_ROLES) {
    m[`staff_roles.${r.key}.enabled`] = `${r.label} · enabled`;
    for (const s of STAFF_SCOPE_FIELDS)
      m[`staff_roles.${r.key}.${s.key}`] = `${r.label} · ${s.label}`;
  }
  return m;
}

/** Recursively collect leaf paths → value (objects only; no arrays in schema). */
function flatten(obj: unknown, prefix = ""): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (obj && typeof obj === "object" && !Array.isArray(obj)) {
    for (const [k, v] of Object.entries(obj)) {
      const p = prefix ? `${prefix}.${k}` : k;
      if (v && typeof v === "object" && !Array.isArray(v)) {
        Object.assign(out, flatten(v, p));
      } else {
        out[p] = v;
      }
    }
  }
  return out;
}

export function diffConfigs(
  current: ProtocolConfigV11,
  next: ProtocolConfigV11,
): ConfigDiff {
  const labels = buildLabels();
  const a = flatten(current);
  const b = flatten(next);
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);

  const entries: DiffEntry[] = [];
  for (const path of keys) {
    if (path === "schema_version") continue;
    if (a[path] === b[path]) continue;
    entries.push({
      path,
      label: labels[path] ?? path,
      before: fmt(a[path]),
      after: fmt(b[path]),
      governance: path.startsWith("clinical_overrides."),
    });
  }
  // Stable, readable ordering: section order then alphabetical within.
  entries.sort((x, y) => x.path.localeCompare(y.path));
  return entries;
}
