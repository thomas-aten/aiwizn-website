# AIWIZN Website + Dashboard — Changelog

Public marketing site (aiwizn.com), authenticated dashboard (aiwizn.com/dashboard), and customer-admin UI.

The clinical engine and Care Support engine track their own versions in `aiwizn-clinical-engine` (`AIWIZN_v676_Deploy_README.md`).

---

## [0.3.0] — 2026-06-11 (Sprint 6.2)

- **Config editor / engine dialect alignment.** The dashboard config editor was writing short-form timing/terminology/branding keys (`door_to_balloon_min`, `term_code_blue`, `hospital_display_name`) while the clinical engine and V1.1 spec read long-form keys (`stemi_door_to_balloon_min`, `code_blue`, `hospital_name_display`). The mismatch caused seed values to be silently lost — `migrateToV11` couldn't find the engine's keys and fell back to base defaults, then the editor wrote its short-form dialect back on publish. Editor is now the source of truth for V1.1 long-form keys throughout.
- `lib/protocolConfig`: `TimingsConfig`, `TerminologyConfig`, `BrandingConfig.hospital_name_display` switched to long-form V1.1 keys. `sepsis_bundle_min` (minutes) → `sepsis_bundle_hr` (hours, matches SEP-1). Terminology now exposes `code_blue`, `septic_shock`, `interpreter_service`, `rapid_response_team`; the engine-less `term_attending` and `term_charge_nurse` fields are dropped.
- `migrateToV11` reads long-form first and falls back to legacy short-form so existing (pre-Sprint 6.2) rows still load correctly. Legacy `sepsis_bundle_min` is divided by 60 on read.
- `_components/ConfigEditor.tsx` + `_components/diff.ts` updated to bind to the new keys; field labels unchanged.
- Out of scope (deferred): standing-orders keys still diverge between the editor (`nurse_initiate_ecg`, `nurse_initiate_troponin`, `pharmacist_dose_heparin`, …) and the engine (`nurse_initiate_aspirin`, `nurse_cath_lab_activation`, …) — entirely different orders, not a renaming. Worth a follow-up sprint that decides the canonical V1.1 standing-orders set and routes accordingly.

## [unreleased] — Sprint 6.1 (in progress)

- Multi-customer admin handling. Platform owners (e.g. AIWIZN staff who are admin of multiple tenants) now resolve cleanly through `getCustomerContext`. Single-customer admins (hospital staff) see no UX change.
- `CustomerSwitcher` component in the header — visible only when a user belongs to more than one customer.
- `aiwizn.selectedCustomerId` cookie (httpOnly, secure, 30-day) persists the active tenant across sessions.
- Replaces `.maybeSingle()` on `customer_users` with a multi-row-aware query.

## [0.1.0] — 2026-06-10 (Sprint 5.5)

- Audit log writes from `publishConfig` server action. Every config publish, every clinical override proposal, every approve/reject decision now records an event in `public.audit_log` with payload metadata (version, engine_slug, changed_sections, before/after for overrides).
- `clinical_override_proposals` table (migration `multitenancy_010`) + admin review queue at `/dashboard/admin/reviews`. Clinical-section edits no longer publish directly — they stage as proposals that a reviewer approves or rejects. Non-clinical edits (timings, terminology, branding) continue to publish in one shot.
- Admin nav badge shows pending proposal count.
- `lib/auditLog.ts`, `lib/clinicalOverrideProposals.ts`, `lib/supabase/admin.ts` (service-role client) added.

## Sprint 5 — Customer admin config UI

- `/dashboard/admin/config` — config editor for customer admins. Edit timings, terminology, branding, standing orders, scenario overrides, and clinical overrides per engine per customer.
- `publishConfig` server action writes a new `protocol_configs` row with bumped version. Versioning is append-only — past versions remain queryable for audit.
- `_components/ConfigEditor.tsx` + `_components/diff.ts` show what will change before publishing.

## Sprint 2 — Dashboard iframe shell

- `/dashboard/engines/[slug]` server component reads the customer's protocol_config from Supabase, serializes it, and injects into the engine iframe via URL hash on initial load.
- `lib/engineRegistry.ts` maps engine slugs to URLs: `clinical-engine` → `demo.aiwizn.com/`, `jc2026` → dedicated route, `care-support` → `demo.aiwizn.com/cna-onboarding.html`.
- Defensive — a missing customer_users mapping yields a public-demo fallback rather than a 500.

## Sprint 1 — Multi-tenant data model

- Four Supabase tables: `customers`, `customer_users`, `customer_engine_access`, `protocol_configs`.
- Helper functions: `is_user_member_of_customer(uuid, uuid)`, `is_customer_admin(uuid)`, `is_user_in_customer(uuid, uuid)`. SECURITY DEFINER with locked `search_path`.
- Row-level security policies on all four tables: customer-scoped reads, admin-only writes.
- Seed: Demo Hospital + WakeMed Health & Hospitals as the first two customers.
- Migration `multitenancy_009_audit_log` adds the append-only audit_log table for governance.

---

**Conventions.** Versions bumped in `package.json`; entries written here in the same commit. Migrations live in `supabase/migrations/` under the `multitenancy_NNN_*` naming scheme. The clinical engine and Care Support engine are versioned independently in their own repos.
