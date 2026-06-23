/**
 * Cohort-invite builder helpers — gated /cohort-invite tool (Thomas task list
 * item 4).
 *
 * This is the website-domain, allowlist-gated successor to the engine-repo
 * `cohort-invite.html` / `duke-cohort-invite.html` tools. Those two static
 * files are FROZEN and remain in production use (Graham/Kelly forwards, Lynn
 * Kenyon). This module powers a NEW, additive tool that lives alongside them.
 *
 * ── Client-safe by construction ──────────────────────────────────────────
 * The interactive builder (`app/cohort-invite/Builder.tsx`) is a client
 * component, so everything here must run in the browser. That rules out
 * importing `lib/demoTenantLinks.ts`: that module evaluates `Buffer.from(...)`
 * at module-load (its top-level `*_LINK` constants), and `Buffer` is not
 * defined in the client bundle. `app/demo/new/Builder.tsx` hit the same wall
 * and re-implemented the encoder; we follow that established precedent.
 *
 * Instead we:
 *   • build configs from `defaultProtocolConfig()` (a pure, client-safe
 *     function in `lib/protocolConfig.ts`, the single source for the schema);
 *   • mirror the per-tenant branding overrides from `lib/demoTenantLinks.ts`
 *     here (UNC / Duke / AHN). These MUST be kept in sync with that file,
 *     which remains the canonical definition. `app/cohort-invite/page.tsx`
 *     runs a server-side parity check against the canonical encoder and logs
 *     a warning if they ever drift.
 *
 * ── URL shape ────────────────────────────────────────────────────────────
 * Each generated link carries BOTH:
 *   • the per-tenant branding via the `#config=<base64>` hash (same mechanism
 *     as demoTenantLinks / the dashboard engine route), AND
 *   • the per-tester cohort auto-start via `?learner_email=…&nurse_name=…&…`
 *     query params (same param names as the existing cohort-invite.html).
 * The query string comes BEFORE the hash: `…/?<query>#config=<base64>`.
 *
 * ── WakeMed is FROZEN ────────────────────────────────────────────────────
 * The existing WakeMed tool emits a query-params-only link (NO `#config`
 * hash); WakeMed's canonical config lives in the engine repo / Supabase
 * `protocol_configs` and must never be regenerated. We replicate that exact
 * behaviour for the WakeMed dropdown option — no hash — rather than inventing
 * a fresh WakeMed payload that would diverge from the canonical one.
 */

import {
  defaultProtocolConfig,
  type ProtocolConfigV11,
} from "@/lib/protocolConfig";

/** Engine origin — identical to `lib/demoTenantLinks.ts`. */
export const CLINICAL_ENGINE_URL = "https://demo.aiwizn.com/";

/** Subject line — matches the existing engine-repo cohort-invite tools. */
export const EMAIL_SUBJECT = "AIWIZN — quick test, would value your read";

export type TenantSlug = "wakemed" | "duke" | "unc" | "ahn" | "other";

export type TenantOption = {
  /** Dropdown value / slug. */
  value: TenantSlug;
  /** Human label shown in the dropdown. */
  label: string;
  /** Full org name → `learner_org` query param + email default. */
  orgName: string;
  /**
   * Short tenant word substituted into the email body
   * ("configured to {tenant} protocols", "for a {tenant} nurse…").
   */
  emailTenant: string;
  /**
   * False for WakeMed (frozen) — that option emits a query-only link with no
   * `#config` hash, matching the existing production tool. True otherwise.
   */
  usesConfigHash: boolean;
  /** Whether picking this reveals the free-text org-name input. */
  isCustom: boolean;
};

/** Dropdown options. WakeMed default, matching the existing tool's default. */
export const TENANT_OPTIONS: readonly TenantOption[] = [
  {
    value: "wakemed",
    label: "WakeMed Health and Hospitals",
    orgName: "WakeMed Health and Hospitals",
    emailTenant: "WakeMed",
    usesConfigHash: false,
    isCustom: false,
  },
  {
    value: "duke",
    label: "Duke University Health System",
    orgName: "Duke University Health System",
    emailTenant: "Duke",
    usesConfigHash: true,
    isCustom: false,
  },
  {
    value: "unc",
    label: "UNC Medical Center",
    orgName: "UNC Medical Center",
    emailTenant: "UNC",
    usesConfigHash: true,
    isCustom: false,
  },
  {
    value: "ahn",
    label: "Allegheny Health Network",
    orgName: "Allegheny Health Network",
    emailTenant: "AHN",
    usesConfigHash: true,
    isCustom: false,
  },
  {
    value: "other",
    label: "Other (enter organization name)",
    orgName: "",
    emailTenant: "",
    usesConfigHash: true,
    isCustom: true,
  },
];

export function tenantOption(slug: string): TenantOption {
  return (
    TENANT_OPTIONS.find((t) => t.value === slug) ?? TENANT_OPTIONS[0]
  );
}

/**
 * UTF-8-safe base64 encoder — byte-identical to
 * `Buffer.from(JSON.stringify(config), "utf8").toString("base64")` used in
 * `lib/demoTenantLinks.ts`. Replicated client-side (see module header). Lifted
 * verbatim from `app/demo/new/Builder.tsx`.
 */
export function encodeConfigHash(config: ProtocolConfigV11): string {
  const json = JSON.stringify(config);
  const bytes = new TextEncoder().encode(json);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

/** Lower-kebab slug from a free-text org name. Matches /demo/new's slugify. */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ---------------------------------------------------------------------------
// Tenant configs — mirrors of lib/demoTenantLinks.ts (canonical source).
// Keep in sync; page.tsx parity-checks these against the canonical encoder.
// ---------------------------------------------------------------------------

/** UNC Medical Center — mirror of `uncMedicalCenterConfig()`. */
function uncConfig(): ProtocolConfigV11 {
  const base = defaultProtocolConfig("unc", "UNC Medical Center");
  return {
    ...base,
    branding: {
      ...base.branding,
      accent_color: "#4B9CD3", // Carolina Blue
      hospital_name_display: "UNC Medical Center",
      attending_naming: "attending",
    },
    terminology: {
      ...base.terminology,
      interpreter_service: "UNC Health Interpreter Services",
    },
  };
}

/** Duke University Health System — mirror of `dukeUniversityConfig()`. */
function dukeConfig(): ProtocolConfigV11 {
  const base = defaultProtocolConfig("duke", "Duke University Health System");
  return {
    ...base,
    branding: {
      ...base.branding,
      accent_color: "#012169", // Duke Blue
      hospital_name_display: "Duke University Health System",
      attending_naming: "attending",
    },
    terminology: {
      ...base.terminology,
      interpreter_service: "Duke Language Services",
    },
  };
}

/** Allegheny Health Network — mirror of `alleghenyHealthNetworkConfig()`. */
function ahnConfig(): ProtocolConfigV11 {
  const base = defaultProtocolConfig("ahn", "Allegheny Health Network");
  return {
    ...base,
    branding: {
      ...base.branding,
      accent_color: "#002F6C", // AHN navy
      hospital_name_display: "Allegheny Health Network",
      attending_naming: "attending",
    },
    timings: {
      ...base.timings,
      stemi_door_to_balloon_min: 75,
      stroke_door_to_needle_min: 45,
      stroke_door_to_ct_min: 20,
      sepsis_bundle_hr: 1,
    },
    terminology: {
      ...base.terminology,
      interpreter_service: "AHN Language Services",
    },
  };
}

/**
 * Map a tenant slug → its `ProtocolConfigV11`. Known tenants return their
 * branded config (mirrors of demoTenantLinks); "other" (or any unknown slug)
 * returns a generic default branded with `customOrgName`, slug auto-derived.
 *
 * NOTE on WakeMed: the WakeMed live link is query-only (no hash) — see module
 * header. This function returns a default-branded WakeMed config only as a
 * non-authoritative fallback; `buildCohortInviteUrl` never hashes it.
 */
export function tenantConfigFor(
  tenantSlug: string,
  customOrgName?: string,
): ProtocolConfigV11 {
  switch (tenantSlug) {
    case "unc":
      return uncConfig();
    case "duke":
      return dukeConfig();
    case "ahn":
      return ahnConfig();
    case "wakemed":
      return defaultProtocolConfig("wakemed", "WakeMed Health and Hospitals");
    case "other":
    default: {
      const name = (customOrgName ?? "").trim() || "Your Organization";
      const slug = slugify(name) || "tenant";
      return defaultProtocolConfig(slug, name);
    }
  }
}

// ---------------------------------------------------------------------------
// URL composition
// ---------------------------------------------------------------------------

export type LearnerDetails = {
  firstName: string;
  lastName: string;
  email: string;
  unit: string;
  role: string;
  /** Org label for the `learner_org` param (tenant orgName or custom name). */
  org: string;
};

const enc = (s: string): string => encodeURIComponent(String(s ?? "").trim());

/**
 * Build the per-tester query string. Param names + order match the existing
 * cohort-invite.html exactly: learner_email, learner_org, nurse_name,
 * learner_role, unit. Returns "" when name or email is missing (no link yet).
 */
export function buildLearnerQuery(learner: LearnerDetails): string {
  const name = `${(learner.firstName || "").trim()} ${(learner.lastName || "").trim()}`.trim();
  const email = (learner.email || "").trim();
  const role = (learner.role || "RN").trim();
  if (!email || !name) return "";
  return (
    `learner_email=${enc(email)}` +
    `&learner_org=${enc(learner.org)}` +
    `&nurse_name=${enc(name)}` +
    `&learner_role=${enc(role)}` +
    `&unit=${enc(learner.unit)}`
  );
}

export type BuildUrlOpts = {
  tenantSlug: string;
  /** Free-text org name when tenantSlug === "other". */
  customOrgName?: string;
  learner: LearnerDetails;
};

/**
 * Compose the full personalized cohort link:
 *   `https://demo.aiwizn.com/?<query>#config=<base64(tenantConfig)>`
 *
 * Returns "" until name + email are filled (mirrors the existing tool's
 * disabled-until-ready behaviour). WakeMed (frozen) gets query-only, no hash.
 */
export function buildCohortInviteUrl(opts: BuildUrlOpts): string {
  const query = buildLearnerQuery(opts.learner);
  if (!query) return "";
  const base = `${CLINICAL_ENGINE_URL}?${query}`;

  const opt = tenantOption(opts.tenantSlug);
  if (!opt.usesConfigHash) {
    // WakeMed — frozen query-only link, no #config hash.
    return base;
  }
  const config = tenantConfigFor(opts.tenantSlug, opts.customOrgName);
  return `${base}#config=${encodeConfigHash(config)}`;
}

// ---------------------------------------------------------------------------
// Email template — mirrors the engine-repo cohort-invite.html body, with the
// per-tenant {tenant} substitution driven by the dropdown selection.
// ---------------------------------------------------------------------------

export type BuildEmailOpts = {
  tenantSlug: string;
  /** Free-text org name when tenantSlug === "other". */
  customOrgName?: string;
  firstName: string;
  url: string;
  senderName: string;
};

/**
 * The short tenant word used inside the email body. Known tenants use their
 * short name; "other" uses the typed org name, falling back to "your" so the
 * sentences still read ("configured to your protocols").
 */
function emailTenantWord(tenantSlug: string, customOrgName?: string): string {
  const opt = tenantOption(tenantSlug);
  if (opt.isCustom) {
    return (customOrgName ?? "").trim() || "your";
  }
  return opt.emailTenant;
}

/**
 * Build the ready-to-send invite email. Mirrors the engine-repo
 * cohort-invite.html template, parameterized by tenant. Returns the subject
 * and body separately so the UI can offer copy-subject / copy-body / copy-all.
 */
export function buildInviteEmail(opts: BuildEmailOpts): {
  subject: string;
  body: string;
} {
  const firstName = (opts.firstName || "").trim() || "[First name]";
  const sender = (opts.senderName || "").trim() || "Thomas";
  const tenant = emailTenantWord(opts.tenantSlug, opts.customOrgName);
  const url = opts.url || "[link will appear once name + email are filled]";

  const body =
    `Hi ${firstName},\n\n` +
    `A quick favor — I've been working with the AIWIZN team on a clinical-decision simulator for cardiac STEMI, ischemic stroke, and sepsis bundle execution. Built against AHA / ASA / SSC standards, configured to ${tenant} protocols — synthetic patients, no PHI. I'd value your read before we open it up more broadly.\n\n` +
    `Your personalized link (pre-fills your info, no setup form):\n\n` +
    `${url}\n\n` +
    `15–25 minutes per scenario, designed as a set. At the end you'll see your own Persona summary — Nurse Wisdom Index, domain breakdown, decision-by-decision recap. Data captures automatically; nothing else for you to do.\n\n` +
    `Two things I'd most value:\n` +
    `• Does the teaching land for a ${tenant} nurse at the bedside?\n` +
    `• Anything that reads off, condescending, or wrong — please flag it\n\n` +
    `Reply with reactions. Even one scenario is valuable.\n\n` +
    `Thanks,\n` +
    `${sender}`;

  return { subject: EMAIL_SUBJECT, body };
}
