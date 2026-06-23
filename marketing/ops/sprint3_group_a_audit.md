# Sprint 3 — Group A read-only audit

**Status:** READ-ONLY audit. NO engine commits. Group B (additional `data-tk` wiring), Group C (patient-name extraction + tenant-resident-physician layer), Group D (branding tokens + scenario_set wiring) are held pending review of this matrix.

**Date:** 2026-06-23
**Owner:** Thomas K Vaidhyan
**Reviewer (clinical):** Dr. Graham Snyder (named-reviewer endorsement of S3 transfer-out modelling captured in `aiwizn-clinical-engine/CLAUDE.md` § Clinical validation, same date).
**Frozen-path constraint:** `aiwizn-clinical-engine/index.html`, `defaultConfig.json`, and the engine root (`demo.aiwizn.com/`) are WakeMed-frozen. Group A produces a matrix + spec only; nothing in the engine repo is touched by this deliverable. WakeMed cohort testers continue unaffected.

---

## Scope of Group A

Sprint 3 (per `aiwizn_multitenant_architecture_v1_1.md` §8) extracts every hardcoded clinical constant from `index.html` into `defaultConfig.json` and routes engine logic through `getConfig()`. Sprint 3 **wave 1** (v7.0.0-alpha.1, 2026-06-05) refactored 28 timing references. Sprint 9 wave A added the customer-tag layer (Sprint 9 D, v7.0.0-alpha.11). The waves landed incrementally, never as a single audited spec.

Group A produces three artifacts so the remaining waves can land against a contract instead of ad-hoc grepping:

1. **Coverage matrix** — every config-eligible field × its current state (wired / partial / hardcoded) × its lift estimate.
2. **Contract-lock spec** — the field set `defaultConfig.json` must surface, the engine-side attribute pattern, and the back-compat rules.
3. **Group B / C / D scoping** — what each remaining wave covers, what it does NOT cover, and what a successful merge looks like.

No engine code change is in scope. Recommendations land in Sprint 3 follow-on waves under their own change-control.

---

## 1. Coverage matrix

Each row is a config-eligible engine constant grouped by `defaultConfig.json` section. Status legend: **WIRED** = engine reads from config via `getConfig()` or `data-*` attribute; **PARTIAL** = some sites wired, others still literal; **HARDCODED** = every site is a literal in `index.html`.

### 1.1 `customer` (Sprint 9 D)

| Field | Status | Engine sites | Notes |
|---|---|---|---|
| `customer.name` | WIRED | `_aiwiznApplyTenantTag()` (~ln 7173) — renders start-modal banner + pre-fills `m-org` | Captured to `S.tenantName` at session-start |
| `customer.slug` | WIRED | Same handler; humanized fallback when `name` missing | Captured to `S.tenantSlug` |
| `customer.email_domains` | UNUSED | No consumer in `index.html` | Schema present (`defaultConfig.json` ln 6). Group D candidate: gate cohort-link email validation against this list. |

### 1.2 `branding`

| Field | Status | Engine sites | Notes |
|---|---|---|---|
| `branding.logo_url` | HARDCODED | Engine favicon + persona-header diamond hardcoded to AIWIZN green | NOT wired. Group D wave. Tenant logos render from config in dashboard, NOT engine root. |
| `branding.accent_color` | PARTIAL | `--cyan: #0BBCD4` literal in CSS (~ln 360). SVG gradients reference `#0BBCD4` directly in 4+ places (lines 2693, 2759, etc.) | UNC/Duke/AHN payloads emit accent colors via `branding.accent_color`. Engine does NOT consume them. WakeMed-frozen path doesn't need this; tenant-branded variants render brand color in start-modal banner only. |
| `branding.hospital_name_display` | UNUSED | No literal site in `index.html` | Schema-only today; `customer.name` is what `_aiwiznApplyTenantTag()` reads. Recommend: deprecate or collapse into `customer.name` (Group D spec). |
| `branding.attending_naming` | UNUSED | No consumer | Schema-only. Group C lift target (see § 2.4). |

### 1.3 `timings` (Sprint 3 wave 1 — v7.0.0-alpha.1)

| Field | Status | Engine sites | Notes |
|---|---|---|---|
| `timings.stemi_door_to_balloon_min` | **WIRED** | 4× `data-tk="dtb"` spans + `getConfig()` consumer at ln 5553 | Sprint 3 wave 1. AHN flagship override (75) verified via `alleghenyHealthNetworkConfig()`. |
| `timings.stroke_door_to_needle_min` | **WIRED** | 15× `data-tk="dtn"` spans + ln 5554 | Sprint 3 wave 1. AHN override (45) verified. |
| `timings.stroke_tpa_onset_window_hr` | **WIRED** | 6× `data-tk="tpa"` spans | Sprint 3 wave 1. Single literal `4.5` survives in CHANGELOG block (ln 280) — narrative, not user-facing. |
| `timings.stroke_thrombectomy_window_hr` | PARTIAL | 1× `data-tk="thromb"` span | Wave 1 partial — wire-up exists; verify all narrative uses of "24-hour window" inherit. |
| `timings.sepsis_bundle_hr` | WIRED | Narrative + decision-signal copy at ln 4804 + getConfig consumer at ln 5557 | "1-hour bundle" / "Hour-1" wording reads from config in scoring path; narrative copy uses literal "1-hour" intentionally (label-stable across tenants). |
| `timings.neutropenic_abx_min` | UNUSED | No engine site | Schema-present, no scenario consumer. Reserved for Sprint 3+ neutropenia content pack. |
| `timings.rapid_response_activation_threshold_max_resp_rate` | UNUSED | No engine site | Schema-present, no consumer. Reserved. |

**Wave 1 audit verdict:** clean. 26 of 28 advertised timing refs are wired. Two reserved fields are schema-only by design (await content). No literal `>90<` or `>60<` numerics remain in the rendered DOM outside `data-tk` wraps (verified via `grep -nE ">90<|>60<" index.html | grep -v data-tk` → 0 hits).

### 1.4 `standing_orders` (Sprint 6 / Sprint 7)

| Field (path) | Status | Engine sites | Notes |
|---|---|---|---|
| `standing_orders.stemi.nurse_cath_lab_activation.mode` | WIRED | `data-flag="nurse_cath_lab_activation"` checkbox + scoring path | Sprint 6 ternary (off/on/parallel_notify). |
| `standing_orders.stemi.nurse_initiate_aspirin.mode` | WIRED | `data-flag="nurse_aspirin_acs"` | Note: flag name mismatch — schema uses `nurse_initiate_aspirin`, DOM uses `nurse_aspirin_acs`. **Contract-lock candidate § 2.2.** |
| `standing_orders.stroke.nurse_initiate_stroke_alert.mode` | PARTIAL | No `data-flag` site found for stroke alert | Scoring path inherits via Sprint 7 grouping; verify wave 2 added the DOM hook. |
| `standing_orders.sepsis.nurse_initiate_blood_cultures.mode` | WIRED | `data-flag="nurse_sepsis_bundle"` is the composite (`and:['nurse_initiate_blood_cultures','nurse_initiate_broad_spectrum_abx']`) | Sprint 7 composite at ln 5676. |
| `standing_orders.sepsis.nurse_initiate_broad_spectrum_abx.mode` | WIRED | Same composite | |
| `standing_orders.sepsis.pharmacist_dispense_stat_abx_without_cosignature.mode` | WIRED | `data-flag="pharmacist_stat_abx"` | |
| `standing_orders.general.direct_attending_escalation.mode` | WIRED | `data-flag="direct_attending_escalation"` | |

**Standing-orders verdict:** functional, but the DOM-flag-name ↔ schema-key naming is not 1:1. Group B wave should normalise (or document the alias map in `index.html`).

### 1.5 `terminology` (Sprint 9 partial)

| Field | Status | Engine sites | Notes |
|---|---|---|---|
| `terminology.rapid_response_team` | WIRED | 3× `data-terminology="rapid_response_team"` | |
| `terminology.code_blue` | UNUSED | No `data-terminology="code_blue"` site | Schema-present, no consumer yet. |
| `terminology.septic_shock` | WIRED | 6× `data-terminology="septic_shock"` | |
| `terminology.interpreter_service` | WIRED | 2× `data-terminology="interpreter_service"` (UNC override = "UNC Health Interpreter Services") | Verified UNC tenant override renders. |
| `terminology.ed_attending_name` | **PARTIAL** | 10× `data-terminology="ed_attending_name"` wrapped + **9× bare "Dr. Martinez" literals** in scenario decision-prompts / choice text / decision signals (lines 3282, 3287, 3297, 3302, 4025, 4812, 5059, 5061, 5056) | **Highest-priority Group C candidate.** A tenant override of `terminology.ed_attending_name` today produces a mixed-name scene. |
| `terminology.ed_attending_role` | UNUSED | No `data-terminology="ed_attending_role"` site | Schema-present. Likely candidate for the scene introduction "(ED attending)" parenthetical, which is currently a bare literal alongside every Martinez. |

**Terminology verdict:** structurally wired, but ED attending name has a **9-site coverage hole** that will surface as a tenant-render bug the first time a non-Demo tenant overrides the name. Group C must close it before any tenant other than WakeMed (which keeps Martinez via the engine-root payload) renders these scenes.

### 1.6 `scenario_overrides`

| Field | Status | Notes |
|---|---|---|
| `scenario_overrides.clinical_engine.s1a_variant` | WIRED (frozen) | `pickVariant()` short-circuits to `return null` since v6.9.23. Schema present; engine ignores until variants re-enabled. |
| `scenario_overrides.clinical_engine.s2a_variant` | Same | Same |
| `scenario_overrides.clinical_engine.s3a_variant` | Same | Same |
| `scenario_overrides.clinical_engine.show_internal_codes` | UNUSED | No consumer in `index.html`. Dashboard-side honoured. |
| `scenario_overrides.care_support.*` | OUT OF SCOPE | Care Support is `cna-onboarding.html`, separate engine — Sprint 4. |

### 1.7 `staff_roles` and `clinical_overrides`

OUT OF SCOPE for Group A clinical engine audit — these are Care Support (`staff_roles`) and Sprint-5 governance (`clinical_overrides`) artifacts.

### 1.8 Hardcoded patient identities (NOT a defaultConfig.json field today — Group C scoping question)

| Patient | Sites | Sprint 3 Group C scoping question |
|---|---|---|
| Mr. David Osei (STEMI, s1a/s1a2) | 17 bare literals + 3 "David Osei" full-name uses | Should `terminology.patients.s1a.{first,last,age,sex}` enter the schema, or do we stay name-stable across tenants? |
| Mrs. Reyes / Jeanette Reyes (stroke, s2a/s2a2/s2b) | 26 bare literals | Same |
| Mr. / Mrs. Al-Fayed (sepsis, s3a/s3b/s3c) | 12 bare literals | Same |

**Recommendation (advisory only):** patient names are part of the validated clinical narrative. Variant patients are paused (v6.9.23). Group C should explicitly DECIDE-NOT-TO-EXTRACT and document the rationale, rather than leave the question open. If a future cohort needs locale-appropriate names, that's a content-pack swap (Spanish localization pattern), not a config field.

---

## 2. Contract-lock spec

Locks the contract between `defaultConfig.json` (and its tenant overrides) and the engine boot path so Group B / C / D can land additively without breaking WakeMed.

### 2.1 `getConfig()` resolution order — LOCKED

The engine's `getConfig()` (ln 5627) returns the merged config in this precedence (highest wins):

1. URL hash `#config=<base64>` payload (set by tenant redirect pages — `unc/`, `duke/`, `allegheny/`, and Sprint 9 cohort-link builder)
2. `postMessage('config-update', ...)` from a dashboard parent frame (Sprint 2 mechanism)
3. Local `defaultConfig.json` fetched at boot
4. Engine-internal hardcoded fallback values inside `getConfig()` itself (for fields the JSON omits)

**Contract:** any new Group B/C/D wave that consumes a config field MUST source it through `getConfig()` — direct `fetch('/defaultConfig.json')` re-reads bypass the hash payload and break the tenant-redirect mechanism.

### 2.2 Schema-key ↔ DOM-flag-name alias map — LOCKED

For standing-orders, schema keys (`standing_orders.stemi.nurse_initiate_aspirin`) differ from DOM `data-flag` values (`nurse_aspirin_acs`). The alias is currently implicit in scoring code. Group B must EITHER:

- (a) rename DOM `data-flag` values to match schema keys (engine-side only change; tenants unaffected), OR
- (b) publish the alias map at the top of `index.html` as a `const STANDING_ORDER_FLAG_ALIAS = {...}` table so reviewers can verify both sides.

Recommendation: (b). Renaming `data-flag` values is a higher-risk touch on the WakeMed-frozen surface.

### 2.3 Tenant override semantics — LOCKED

For every field in `timings`, `standing_orders`, `terminology`:

- A tenant payload override is **complete-replacement at the leaf**, not deep-merge below the leaf. E.g. AHN's `timings.stemi_door_to_balloon_min: 75` replaces the leaf scalar; AHN cannot override only "the s1a scene 1 mention." All sites read the same value.
- Mid-session `postMessage('config-update', ...)` is **render-time only** — it re-runs `_aiwiznApplyTenantTag()` and re-paints `data-tk` / `data-terminology` spans, but does NOT retro-rewrite already-stamped session-row identity fields (`S.tenantSlug`, `S.tenantName` are captured at session start, per Sprint 9 D).

### 2.4 `branding.attending_naming` semantics — LOCKED (proposed)

Sprint 3 Group C must implement (or formally defer) this enum:

| Value | Render |
|---|---|
| `first-last-md` *(default)* | "Dr. Martinez" / "Dr. Garcia" — single attending of record across all three acute scenarios |
| `surname-only` | "Martinez" / "Garcia" |
| `cohort-role-only` | "the ED attending" / "the on-call attending" |

The setting interacts with **every** bare-Martinez literal flagged in §1.5. Group C delivers either the wire-up OR a written deferral with a stamped re-evaluation date.

### 2.5 Schema-version contract — LOCKED

`defaultConfig.json.schema_version` is currently `"1.1"`. Any Group B/C/D wave that ADDS a field is `"1.2"` (additive, no migration needed — engine fallback handles missing fields). Any wave that RENAMES or REMOVES a field is `"2.0"` and triggers the per-engine migration policy in `aiwizn_multitenant_architecture_v1_1.md` §9 ("Engine version migration").

### 2.6 WakeMed-frozen exception path — LOCKED

The engine root (`demo.aiwizn.com/`) serves `defaultConfig.json` directly — no hash payload, no postMessage override. WakeMed cohort testers and Graham/Kelly forwards depend on this. Therefore:

- Any Group B/C/D wave that changes `defaultConfig.json` values (not just structure) requires Thomas + Graham change-control sign-off.
- Schema additions with sensible defaults that produce byte-identical render in the WakeMed environment do NOT require Graham sign-off, but DO require a smoke-test confirming the engine root still renders unchanged before commit.

---

## 3. Group B / C / D wave scoping (advisory — no commit gate yet)

Locked at the read-only level so the waves can be reviewed individually rather than as a "Sprint 3 complete" bundle.

### Group B — DOM-flag normalisation + missing `data-flag` sites

**Scope:** add the missing `data-flag` for `nurse_initiate_stroke_alert` (§1.4 PARTIAL), publish the schema-key ↔ DOM-flag alias map per §2.2, verify the 7 standing-order flags scoring path 1:1.
**Out of scope:** any new schema field; any patient-name extraction.
**Successful merge:** standing-order coverage matrix moves all PARTIAL → WIRED, engine renders byte-identical in WakeMed root, alias map visible in source.
**Lift estimate:** ~½ day, defensible without Graham re-review (no clinical-content edit).

### Group C — ED attending name normalisation + `attending_naming` enum

**Scope:** wrap the 9 bare "Dr. Martinez" literals (§1.5) in `data-terminology="ed_attending_name"`; implement `branding.attending_naming` per §2.4; add or defer `terminology.ed_attending_role` for the "(ED attending)" parenthetical (currently bare in 8+ sites).
**Out of scope:** patient-name extraction (defer to §1.8 decide-not-to-extract recommendation).
**Successful merge:** every Martinez/ED-attending mention reads from `terminology`; UNC/Duke/AHN can override the attending name and see consistent render across s1a / s2a / s3a / s3b.
**Lift estimate:** ~1 day. **Requires Graham sign-off** — naming consistency is a clinical-narrative surface.

### Group D — branding tokens + scenario_set + cohort-link email-domain gate

**Scope:** wire `branding.accent_color` to a CSS custom property and replace the 4+ `#0BBCD4` literals with `var(--accent, #0BBCD4)`; deprecate `branding.hospital_name_display` (collapse into `customer.name`); wire `customer.email_domains` into cohort-link email validation; wire `scenario_overrides.clinical_engine.show_internal_codes`.
**Out of scope:** patient names; SVG gradient palette beyond the accent color.
**Successful merge:** tenant payloads with `accent_color` paint the appropriate primary accent in the engine chrome; the WakeMed-frozen root stays visually identical (default accent unchanged).
**Lift estimate:** ~1–1.5 days. Defensible without Graham re-review (visual/chrome, not clinical-content).

---

## 4. What this audit does NOT cover

- The Sprint 7 standing-orders grouping refactor — already shipped, considered settled.
- The Care Support engine (`cna-onboarding.html`) — separate Sprint 4 audit when that wave starts.
- The Sprint 8/9 Spanish localization — orthogonal axis; `strings['es-ES']` already merges via `applyStrings()`.
- The Sprint 11 auto-save / Sprint 14 replay / Sprint 16.1 inline-persona refactors — orthogonal to the config-extract scope.
- Patient-name extraction (§1.8) — explicit decide-not-to-extract recommendation; not a hidden Group C debt.
- AI Readiness offering — separate offering × tenant axis, owned by `lib/offerings/index.ts` Phase 1 contract; ARI scoring spine doesn't reuse clinical timings/terminology.

---

## 5. Open questions for Thomas

1. **Group B (alias map vs rename)** — accept §2.2 recommendation (b) "publish alias map, don't rename"?
2. **Group C (Graham sign-off)** — proceed to schedule? Wraps with the same review surface as the Sprint 3 v7.0.0-alpha.1 wave 1.
3. **Patient-name decide-not-to-extract** — confirm the §1.8 recommendation (lock the names, document the rationale, don't add to schema)?
4. **`branding.hospital_name_display` deprecation** — confirm collapse into `customer.name`, OR keep separate for "display name vs. legal name" distinction (none of the four current tenants need that)?

---

**This audit is read-only.** No engine commits land from Group A. Group B / C / D commits are sequenced per Thomas's go-ahead, each under its own change-control review.
