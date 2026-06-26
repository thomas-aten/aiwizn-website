# AIWIZN — open task list

Lightweight, append-only working list. New items go to the bottom; closed items move to "Closed" with a date.

---

## Open

### Email-fix migration (staged, NOT yet applied)

- **Migration file:** `supabase/migrations/20260625120000_notify_new_session_offering_dispatch.sql`
- **Freeze gate:** clinical-template slice byte-verified — md5 `2b5a1535f41044f8b4225b25afa43133`, 11479 bytes — matches the live `private.notify_new_session()` slice extracted via `pg_get_functiondef`. WakeMed-frozen path will render byte-identical after apply.
- **Dispatch:** fails closed. `offering='ai-readiness'` → ARI builder; `offering='clinical'` OR `scenario_slug='cardiac-stroke-sepsis-v5'` → clinical builder; anything else → no-send + INSERT into `private.email_dispatch_log` + raise NOTICE.
- **Action required:**
  1. Thomas reviews the staged migration.
  2. Apply via Supabase MCP `apply_migration` (or dashboard) when go is given.
  3. After apply: re-fetch `pg_get_functiondef` and confirm the clinical slice md5 still matches the same target.
  4. Synthetic-row test: insert one stamped `offering='clinical'` row → confirm Resend body matches the pre-migration capture. Insert one `offering='ai-readiness'` row → confirm ARI labels render and `raw_payload->'ari_domains'` strongest/development populate non-zero.
  5. After verified: flip `SHOW_AI_READINESS = true` in `app/demo/page.tsx` to re-open the AR card on `/demo`.

### PCO table-name drift

- `aiwizn-clinical-engine/cna-onboarding.html` calls `.from('cna_onboarding_records')`. Production only has `pco_onboarding_records` (0 rows). Inserts are likely failing silently — confirm by checking Supabase JS `.insert()` error handling in the engine. Either rename in the engine (one-line .from() change, but it's in the frozen-tester surface) or add a `cna_onboarding_records` → `pco_onboarding_records` view alias.

### JC2026 engine row shape

- `aiwizn-website/public/engines/jc2026/index.html` `buildSessionRow()`:
  - Does not stamp `raw_payload.offering` — will be a "unmapped offering" row under the new strict dispatch and get no learner email (intentional: no completion-email work has been scoped for JC2026 yet, but flagging).
  - Does not populate `learner_email` — trigger short-circuits, so no email today regardless.
  - Hardcodes `unit: "Med-Surg · Floor 4 East"` — every JC2026 learner appears in the same unit in dashboards.
  - Reuses clinical scene columns (`s1a`, `s1b_1`, `s1c`, `s2a`, `s2b`) for JC2026 phases — dashboard queries that join by `scenario_slug` need to be aware.

### Cross-engine tech debt (logged after the email defect ships)

- ARI composite reuses the `nwi_pct` numeric column — rename to `composite_pct` at the Shell-seam build (no schema change now).
- Add `offering` stamp + `composite_pct` rename + `index_label` column (NWI/PCRI/ARI/JCRI) when refactoring the row shape.
- Clinical engine `index.html` does not stamp `raw_payload.offering = 'clinical'` — the new dispatch relies on `scenario_slug='cardiac-stroke-sepsis-v5'` as the implicit signal. Acceptable today, but stamp explicitly when the WakeMed freeze lifts (Sprint 3/4 multi-tenant migration).

### Marketing copy follow-ups

- `lib/pricing.ts ENGINES_INCLUDED`: the "AIWIZN Clinical Engine" blurb still says "**NBME-recognised** scenario engine" (British spelling + uses the broad-claim wording the R12 audit flagged). Apply: "NBME-recognised" → "NBME-semifinalist (2015)" + spelling-hygiene "recognised" → "recognized."
- Q9 normalize: Arvind's "25+ years" personal-experience bio kept intact (read as outside the ATEN-history normalization scope). Flag if rule should extend.
- R1–R5 archive links: NBME 2015 / Gates NGLC 2011 / MacArthur DML 2010 finalist standings should have URLs (or data-room references) added when locatable.

### Shell v1 wire-up (deferred per directive)

- Shell modules (`engine-shell.css`, `engine-shell.js`, `resonance-host.js`, `index-viz.js`, `persistence.js`, `scene-art.js`) sit in `aiwizn-clinical-engine/shell/` — written, untouched. **Note (2026-06-26):** only `engine-shell.js`, `resonance-host.js`, and the renamed `NAMING_CONVENTIONS.md` are currently in the `shell/` directory on disk — the other four shell modules from earlier turns appear to have been removed (working-tree cleanup between sessions). They will need to be re-staged when the wire-up resumes.
- AI Readiness `index.html` consumes them after the completion-email defect is verified shipped.
- AR-card hub re-enable depends on this PLUS the prior gates.

### AR engine prod-verify (2026-06-26) — gates for SHOW_AI_READINESS=true

| Item | Status | Note |
|---|---|---|
| 1. ARI scoring end-to-end | ✓ PASS | All 5 domains compute non-zero on full sweep; composite computes; stage bands correct |
| 2. Completion email (real fire) | ✓ PASS | 2 Resend POSTs HTTP 200 (internal + ARI learner); content needs Thomas inbox eyeball |
| 3. Persistence indicator | ✓ PASS | LIVE chip + ari-save-pill (sync / ok / fail) + pending-saves queue; no demo-mode fallback path in code |
| 4. Shell parity | ⚠ PARTIAL | Visual parity by copy-pattern (cream surface, fonts, layout). ARIA display name ✓. Code-level shell-module wiring NOT shipped (Shell v1 wire-up still deferred). Looks consistent to a visitor; isn't yet sharing the shell/ modules. |
| 5. Tenant-config cleanliness | ✓ PASS | Zero tenant literals in `scenarios.json` or the engine's user-facing strings. The only WakeMed/UNC/Duke/Allegheny mentions are inside the doc-comment header that documents what the engine does NOT touch. |

Open call for Thomas: PARTIAL on Item 4 is the only sub-green. Two paths:
- **Accept the partial** and flip `SHOW_AI_READINESS=true` now — the engine looks consistent to a visitor; shell-module wire-up is a separate refactor.
- **Hold the flip** until Shell v1 wire-up ships — strict reading of the original "shell parity" gate.

---

## Closed (this session)

- **2026-06-25 · R14 Pricing RUAIH disclaimer** — applied, deployed, verified live on `aiwizn.com/pricing`.
- **2026-06-25 · Hero financial stats rewrite** — NSI 2026 anchor (~$60K), Benner/AACN/Schmidt-Bjork/Mercer/NCSBN/HRSA citations footnoted.
- **2026-06-25 · Problem section stats** — aligned to NSI 2026 anchor; $88K corrected → ~$60K; 1:6 ratio softened to 1:1 best-practice framing.
- **2026-06-25 · R-fix marketing copy** — R1/R2/R3/R4/R5/R6/R7/R8/R9/R10/R11/R12/R13 dispositions applied across Hero / Problem / Lineage / Flywheel / For Hospitals / For Schools / Pricing / OfferingMatrix.
- **2026-06-25 · British → US spelling** — 21 substitutions across 13 marketing/component files; testimonial quotes preserved verbatim; OfferingMatrix RUAIH disclaimer locked phrase preserved.
- **2026-06-25 · Q9 year-lock** — site copy "21 years" anchored to ATEN Inc. (est. 2005) footnote; WakeMed deck slides 2/3/4 normalized 20-year/two-decade/25-year → 21; Arvind bio + slide 13 personal-experience kept.
- **2026-06-25 · AR hub card hidden** — `SHOW_AI_READINESS = false` to prevent broken email reaching Graham/Diane/Robin/Lynn until the email-fix migration ships and verifies.
- **2026-06-25 · Engine Shell v1 rename** — `aria-host.js` → `resonance-host.js`; namespace `ARIAHost` → `ResonanceHost`; persona key `ariaPersona` → `resonancePersona`; default mentor `'ARIA'` → `'RESONANCE'`; CSS `.es-aria-tag` aliased to `.es-resonance-tag` for back-compat.
- **2026-06-25 · Cross-engine notification audit** — matrix delivered; class-bug surface enumerated; revised dispatch (fail-closed + log) encoded in the staged migration.
- **2026-06-25 · Email-fix migration applied + smoke-verified** — `private.notify_new_session()` refactor live in prod; clinical helper byte-identical (md5 `2b5a1535f41044f8b4225b25afa43133`); ARI builder live; `private.email_dispatch_log` table + `_log_unmapped_offering` helper added; fail-closed dispatch routes unmapped offerings to log-and-no-send. Smoke #1/#2/#3 all green; sentinel-tagged synthetic rows cleaned up.
- **2026-06-26 · Naming rule — ARIA (UI) / RESONANCE (code/framework)** — `shell/resonance-host.js` now resolves display name with `tenantConfig.terminology.display_name` → `terminology.mentor_name` → `persona.displayName` → `persona.mentor_name` → `'ARIA'`. Default flipped from RESONANCE to ARIA for UI rendering. Code-side names (file `resonance-host.js`, namespace `window.ResonanceHost`, config key `resonancePersona`, CSS `.es-resonance-tag`) all unchanged. Naming rule documented in `shell/NAMING_CONVENTIONS.md` (scoped to the ARIA/RESONANCE split only — the canonical 10-agent messaging kit lives separately as `AIWIZN_Messaging_Kit.md`).
