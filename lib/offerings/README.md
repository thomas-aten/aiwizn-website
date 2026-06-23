# lib/offerings — offering × tenant architecture

**Status:** Architecture decision record + type contract. Not a refactor; the existing tenant URLs continue working unchanged. This module sets the contract the AI Readiness build slots into cleanly.

---

## Context

Today's per-URL demo links (`/wakemed`, `/unc`, `/duke`, `/allegheny`) all serve the **same offering** (the Clinical engine — NWI scoring, STEMI/stroke/sepsis scenarios) configured per tenant. Going forward we'll have multiple offerings (Clinical · Patient Care Onboarding · AI Readiness · Joint Commission Readiness · vertical-specific packs), and each should be composable with any tenant config.

The existing pattern hardcodes the offering at the URL level — `/wakemed` IS the clinical engine — which doesn't scale. This module formalises the two axes.

## The two functions

```ts
// What the engine measures.
export interface OfferingConfig {
  slug: string;                    // "clinical" | "ai-readiness" | "patient-care-onboarding" | "joint-commission-readiness"
  name: string;                    // "Clinical Engine" | "AI Readiness Engine" | …
  scenarioSet: string;             // matches engine's scenario_set field
  scoringIndex: "NWI" | "PCRI" | "ARI" | "JCRI";
  defaultDomains: readonly string[]; // competency domains for this offering
}

export function offeringConfigFor(slug: string): OfferingConfig;

// Whose protocols + branding render.
// (Already exists in lib/demoTenantLinks.ts as the *Config() functions —
// this module re-exports them through a uniform interface.)
export function tenantConfigFor(slug: string): ProtocolConfigV11;
```

Composing the two:

```ts
const cfg = composeConfig(
  offeringConfigFor("ai-readiness"),
  tenantConfigFor("ahn"),
);
// → engine boots with AI Readiness scenarios, AHN branding, AGH-flagship timings
//   (timings irrelevant for AI Readiness offering — composeConfig zeros them
//   out of the rendered config, so the modal copy reflects the offering)
```

## Migration plan (additive)

**Phase 1 — Architecture-only (this commit):**
- This README + the TypeScript interfaces in `lib/offerings/index.ts`
- No runtime impact, no URL changes
- AI Readiness build (next sprint) imports from here

**Phase 2 — When AI Readiness lands:**
- `demo.aiwizn.com/ai-readiness/` redirect page → composes `offeringConfigFor("ai-readiness")` with `tenantConfigFor("demo-hospital")` (default tenant)
- No existing URL touched

**Phase 3 — Per-tenant AI Readiness (only if a tenant signs up):**
- `demo.aiwizn.com/ai-readiness/wakemed/` etc. — composes AI Readiness offering with that tenant's branding
- Still no existing URL touched

## Why this matters now

The AI Readiness build cannot reuse the existing `lib/demoTenantLinks.ts` exports as-is — those produce Clinical-engine configs. If the AI Readiness build hardcodes a separate config-builder, we end up with two parallel mechanisms and a maintenance fork. This module is the bridge: one config-builder for tenants, one for offerings, composed at link-build time.

## What this is NOT

- Not a refactor of the live tenant URLs. WakeMed/UNC/Duke/AHN continue serving via `lib/demoTenantLinks.ts` exactly as today.
- Not a runtime route change. `/wakemed` stays `/wakemed`.
- Not a new persistence layer. Engine still reads `#config=<base64>` from the URL hash.

## Open questions (decided at AI Readiness build time)

- **AI Readiness scoring spine** — universal from day one, with healthcare-flavored scenarios as first content pack? *(Yes, per the AI Readiness positioning brief.)*
- **Joint Commission Readiness** — separate offering, or sub-scenario set within AI Readiness? *(Likely sub-scenario set; both have the same domains, the JC version is the org-prep variant.)*
- **Tenant-branded AI Readiness** — Phase 2 add, gated on a tenant requesting it.

---

## Frozen-path guarantee

This module never imports from or modifies:
- `aiwizn-clinical-engine/index.html` (engine root — WakeMed)
- `aiwizn-clinical-engine/defaultConfig.json` (engine default tenant)
- `aiwizn-clinical-engine/cohort-invite.html` (Graham/Kelly forward URL)

If any future change to this module would require touching those — stop, flag.
