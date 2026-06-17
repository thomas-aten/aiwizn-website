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

/** The walk-up Demo Hospital link (anonymous explore). */
export const DEMO_HOSPITAL_CLINICAL_ENGINE_LINK = buildClinicalEngineLink(
  demoHospitalConfig(),
);

/** Care Support / Patient Care Onboarding — uses the default Demo Hospital
 *  config; tenants get their own version via the dashboard's [slug] route. */
export const CARE_SUPPORT_ENGINE_LINK = buildCareSupportEngineLink(
  demoHospitalConfig(),
);
