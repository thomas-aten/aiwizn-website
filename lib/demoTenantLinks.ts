/**
 * Demo tenant link generator — Sprint 15.
 *
 * The WakeMed and UNC external-tester links share ONE mechanism, established
 * by the Sprint 2 multi-tenant work:
 *
 *   `${ENGINE_URL}#config=${base64(JSON.stringify(ProtocolConfigV11))}`
 *
 * The clinical engine app at https://demo.aiwizn.com/ reads `window.location
 * .hash` on boot, base64-decodes the payload, parses the JSON, and applies the
 * branding / timings / terminology overrides. There is NO server-side token
 * resolution and NO authentication — the hash carries the full tenant config,
 * which is why these links can be opened by external nurse testers directly
 * in a browser.
 *
 * The same mechanism is invoked server-side in
 * `app/(app)/dashboard/engines/[slug]/page.tsx` for authenticated tenant
 * users, where the config payload comes from `protocol_configs` instead of
 * being hard-coded. The external-tester pattern simply omits the database
 * round-trip and inlines the payload at build time.
 *
 *   CRITICAL: WakeMed is FROZEN. The WakeMed payload below is provided for
 *   reference/verification only — DO NOT regenerate or alter the WakeMed
 *   link. UNC is the only new link this sprint is producing.
 */

import {
  defaultProtocolConfig,
  type ProtocolConfigV11,
} from "@/lib/protocolConfig";

const CLINICAL_ENGINE_URL = "https://demo.aiwizn.com/";
const CARE_SUPPORT_ENGINE_URL = "https://demo.aiwizn.com/cna-onboarding.html";

/** Encode a v1.1 config payload into the `#config=<base64>` URL hash form. */
function encodeConfigHash(config: ProtocolConfigV11): string {
  // Buffer is available in the Node runtime (server components, route
  // handlers, build-time generation). The same encoding scheme is used by
  // `app/(app)/dashboard/engines/[slug]/page.tsx`.
  return Buffer.from(JSON.stringify(config), "utf8").toString("base64");
}

/**
 * Build a per-tenant clinical-engine link.
 *
 * @returns full `demo.aiwizn.com/#config=…` URL ready to paste into a partner
 *   outreach email.
 */
export function buildClinicalEngineLink(config: ProtocolConfigV11): string {
  return `${CLINICAL_ENGINE_URL}#config=${encodeConfigHash(config)}`;
}

/** Same idea, for the Care Support / Patient Care Onboarding engine. */
export function buildCareSupportEngineLink(config: ProtocolConfigV11): string {
  return `${CARE_SUPPORT_ENGINE_URL}#config=${encodeConfigHash(config)}`;
}

// ---------------------------------------------------------------------------
// Tenant configs
// ---------------------------------------------------------------------------

/**
 * Demo Hospital — the generic walk-up tenant config that
 * `demo.aiwizn.com/` falls back to when no hash is present. Used as the
 * "explore the engine" anonymous-access link on the gated hub.
 */
export function demoHospitalConfig(): ProtocolConfigV11 {
  return defaultProtocolConfig("demo-hospital", "AIWIZN Demo Hospital");
}

/**
 * UNC Medical Center — Sprint 15 deliverable. UNC Health branding (Carolina
 * Blue accent #4B9CD3), the same three high-acuity scenarios as WakeMed
 * (sepsis, acute MI/STEMI, stroke — those are the default clinical engine
 * scenario set), and UNC Health Interpreter Services terminology.
 *
 * Timing targets default to the AHA/SEP-1 published gold standards — UNC has
 * not yet ratified its own protocol-timing deltas. Flagged for Thomas to
 * follow up with Robin Jacob (UNC clinical lead) so we can replace these
 * with UNC's institution-specific targets in a follow-up sprint.
 */
export function uncMedicalCenterConfig(): ProtocolConfigV11 {
  const base = defaultProtocolConfig("unc", "UNC Medical Center");
  return {
    ...base,
    branding: {
      ...base.branding,
      // Carolina Blue — the UNC Health brand accent.
      accent_color: "#4B9CD3",
      hospital_name_display: "UNC Medical Center",
      attending_naming: "attending",
    },
    terminology: {
      ...base.terminology,
      // UNC uses "Interpreter Services" branded as "UNC Health Interpreter
      // Services" in their nursing handbook.
      interpreter_service: "UNC Health Interpreter Services",
    },
  };
}

/**
 * The final, paste-into-outreach UNC clinical-engine link. Importing this
 * constant runs the encoder once at module load.
 */
export const UNC_CLINICAL_ENGINE_LINK = buildClinicalEngineLink(
  uncMedicalCenterConfig(),
);

/**
 * Duke University Health System — added 2026-06-17 after Lynn Kenyon
 * (Duke ICU CCRN) ran the cardiac-stroke-sepsis set as the first external
 * clinical leader to clear it. Duke Blue accent #012169 (official Duke
 * brand color), "Duke University Health System" display name, and
 * "Duke Language Services" interpreter-service terminology.
 *
 * Timing targets default to AHA/SEP-1 published gold standards — Duke has
 * not yet ratified institution-specific protocol-timing deltas. Flagged
 * to revisit with Lynn for any Duke-specific D2B / D2N / sepsis-bundle
 * targets we should bake in.
 *
 * Additive: WakeMed and UNC payloads untouched. Same hash mechanism as
 * the other tenants — no new persistence layer, no new auth path.
 */
export function dukeUniversityConfig(): ProtocolConfigV11 {
  const base = defaultProtocolConfig("duke", "Duke University Health System");
  return {
    ...base,
    branding: {
      ...base.branding,
      // Duke Blue — the official Duke University brand color.
      accent_color: "#012169",
      hospital_name_display: "Duke University Health System",
      attending_naming: "attending",
    },
    terminology: {
      ...base.terminology,
      interpreter_service: "Duke Language Services",
    },
  };
}

export const DUKE_CLINICAL_ENGINE_LINK = buildClinicalEngineLink(
  dukeUniversityConfig(),
);

/**
 * Allegheny Health Network — added 2026-06-21 as a channel-partner intro
 * (Paul Palamara, Pinnacle Mx Group). AHN navy accent #002F6C (Allegheny
 * Health Network's official brand color) and "Allegheny Health Network"
 * display name. Slug "ahn".
 *
 * Modelled on the Allegheny General Hospital (AGH) flagship profile:
 *   - PCI-receiving center → D2B ≤75 min (vs AHA gold-standard 90)
 *   - Comprehensive Stroke Center → D2N ≤45 min (vs ASA target 60), D2CT 20, D2device 90
 *   - SEP-1 1-hr bundle (vs the 3-hr default), reflecting AGH's published
 *     sepsis bundle performance
 * These are tighter than the AHA/ASA generic defaults; flagged for AHN
 * clinical lead review before any live cohort use.
 *
 * Scenarios: the default clinical-engine scenario set covers the high-acuity
 * trio (sepsis recognition, acute MI/STEMI activation, stroke tPA decision).
 * NOTE — "trauma" is positioning language for AGH's Level I trauma status,
 * NOT a selectable scenario in the engine yet. A trauma scenario module is
 * flagged for a future sprint.
 *
 * Terminology: AHN-specific names where confirmed; defaults otherwise.
 *
 * Additive: WakeMed, UNC, and Duke payloads untouched. Same hash mechanism
 * as the other tenants — no new persistence layer, no new auth path.
 */
export function alleghenyHealthNetworkConfig(): ProtocolConfigV11 {
  const base = defaultProtocolConfig("ahn", "Allegheny Health Network");
  return {
    ...base,
    branding: {
      ...base.branding,
      // AHN navy — Allegheny Health Network's official brand color.
      accent_color: "#002F6C",
      hospital_name_display: "Allegheny Health Network",
      attending_naming: "attending",
    },
    // AGH flagship timing profile: PCI-receive + Comprehensive Stroke Center
    timings: {
      ...base.timings,
      stemi_door_to_balloon_min: 75, // PCI-receive flagship (vs 90 default)
      stroke_door_to_needle_min: 45, // Comprehensive Stroke Center (vs 60 default)
      stroke_door_to_ct_min: 20,     // Comprehensive Stroke Center (vs 25 default)
      sepsis_bundle_hr: 1,           // SEP-1 1-hr bundle (vs 3 default)
    },
    terminology: {
      ...base.terminology,
      interpreter_service: "AHN Language Services",
    },
  };
}

export const ALLEGHENY_CLINICAL_ENGINE_LINK = buildClinicalEngineLink(
  alleghenyHealthNetworkConfig(),
);

/** The walk-up Demo Hospital link (anonymous explore). */
export const DEMO_HOSPITAL_CLINICAL_ENGINE_LINK = buildClinicalEngineLink(
  demoHospitalConfig(),
);

/** Care Support / Patient Care Onboarding — uses the default Demo Hospital
 *  config; tenants get their own version via the dashboard's [slug] route. */
export const CARE_SUPPORT_ENGINE_LINK = buildCareSupportEngineLink(
  demoHospitalConfig(),
);
