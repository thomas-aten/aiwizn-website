# AIWIZN Demo Map — operational reference

**Last updated:** 2026-06-25
**Owner:** Thomas K Vaidhyan
**Purpose:** Single source of truth for every demo URL, what it serves, who it's for, and how it's gated. Updated additively as tenants and offerings land.

---

## The two axes

AIWIZN demos compose along two independent axes:

- **Offering** — what the engine measures (Clinical / Patient Care Onboarding / AI Readiness / Joint Commission Readiness)
- **Tenant** — whose protocols + branding render (WakeMed / UNC / Duke / AHN / Default)

The codebase models these as `offeringConfigFor(offering)` × `tenantConfigFor(tenant)`. Adding a new tenant or a new offering is additive — no URL-hardcoding required.

---

## Live URLs (production, demo.aiwizn.com)

### Clinical offering × tenant

| URL | Tenant | Branding | Timings | Audience | Gating | Frozen status |
|---|---|---|---|---|---|---|
| `demo.aiwizn.com/` | Default | AIWIZN green | AHA/SEP-1 defaults | Anonymous walk-up demo, public hero | None | **WakeMed-frozen** — engine root is the WakeMed forwarded URL Graham/Kelly send to live nurse testers. Do NOT modify `index.html`, `defaultConfig.json`, or the `/` engine boot path without an explicit WakeMed change-control review. |
| `demo.aiwizn.com/unc/` | UNC Medical Center | Carolina Blue (#4B9CD3) | AHA/SEP-1 defaults · "UNC Health Interpreter Services" | UNC partnership prospects · Sprint 15 deliverable | None — public anonymous | Live |
| `demo.aiwizn.com/duke/` | Duke University Health System | Duke Blue (#012169) · "Duke Language Services" | AHA/SEP-1 defaults | Lynn Kenyon's session captured here · published widely | None — public anonymous | Live |
| `demo.aiwizn.com/allegheny/` | Allegheny Health Network | AHN Navy (#002F6C) · "AHN Language Services" | **AGH flagship** — D2B 75 / D2N 45 / D2CT 20 / sepsis 1hr | Paul Palamara channel-partner intro · AHN direct prospect only | None — public anonymous | Live · **NOT listed on `/demo` hub** (Paul's direct link only) |

### Other offerings × default (AIWIZN-generic) tenant

| URL | Offering | Index | Status | Audience | Gating | Frozen status |
|---|---|---|---|---|---|---|
| `demo.aiwizn.com/cna-onboarding.html` | Patient Care Onboarding | PCRI | **Live · validated** | CNA / PCT / PCA cohort prospects | None — public anonymous | Live |
| `demo.aiwizn.com/ai-readiness/` | AI Readiness Engine (v1, Phase 1) | ARI | **Live · default tenant** — 5 RUAIH-aligned scenarios (governance · bias · failure-mode · disclosure · escalation), ARI scoring, OFFERING="ai-readiness" stamped on every save | Healthcare-flavored first; vertical-agnostic spine. Surfaces RUAIH "prepare for" framing. | None — public anonymous | Live · Phase 1 |
| `aiwizn.com/engines/jc2026` (and `aiwizn.com/dashboard/engines/jc2026`) | Joint Commission Readiness | JCRI | **Live · default tenant** | Hospital JC-prep teams | Public route at `/engines/jc2026`; dashboard route is gated | Live |

### Other engine surfaces

| URL | Purpose | Audience | Gating | Frozen status |
|---|---|---|---|---|
| `demo.aiwizn.com/dashboard.html` | Admin dashboard — session list + drill-down + inline persona render (Sprint 16.1) | Allow-listed admins (thomas@ateninc.com) | Supabase magic-link + `ALLOWED_EMAILS` client allow-list | Live |
| `demo.aiwizn.com/cohort-invite.html` | Original cohort builder (free-text org, WakeMed default) | Graham/Kelly forwards · WakeMed cohort | None | **FROZEN** — Graham/Kelly forward URLs depend on this exact page. Do NOT change. |
| `demo.aiwizn.com/duke-cohort-invite.html` | Duke-defaulted cohort builder | Lynn Kenyon · Duke cohort | None | Live · unchanged |

---

## Website URLs (aiwizn.com — gated)

| URL | Purpose | Audience | Gating | Status |
|---|---|---|---|---|
| `aiwizn.com/demo` | Gated demo hub — catalogue of tenant demos | Allowlisted partners (ateninc.com, named invitees) | Supabase SSR auth + `INVITE_EMAILS` allowlist | Live · Sprint 15 |
| `aiwizn.com/demo/new` | Channel-partner self-serve builder — Paul's hospital intro tool | Paul Palamara · ateninc.com staff | Allowlist via `isDemoHubAllowed` | Live |
| `aiwizn.com/cohort-invite` | NEW gated cohort builder — tenant dropdown (WakeMed / Duke / UNC / AHN / Other) | Allowlisted users including Paul | Allowlist via `isDemoHubAllowed` | Live · supersedes engine-repo static page for new prospects |

---

## /demo hub catalogue rules

The `/demo` page lists offerings × tenants for gated browsing. Current rules (post-2026-06-25 consolidation):

- **Offering cards listed (every offering × AIWIZN-generic):**
  - Nurse Wisdom Index (Clinical · Demo Hospital tenant) → `DEMO_HOSPITAL_CLINICAL_ENGINE_LINK`
  - Patient Care Onboarding Engine → `CARE_SUPPORT_ENGINE_LINK`
  - AI Readiness Engine (ARI) → `https://demo.aiwizn.com/ai-readiness/` *(flag `SHOW_AI_READINESS=true` in `app/demo/page.tsx`)*
  - Joint Commission Readiness → `/dashboard/engines/jc2026`
- **Tenant cards listed:** WakeMed (as the engine root, via the Nurse Wisdom Index card), UNC Medical Center, Duke University Health System
- **Tenant cards NOT listed:** AHN — Paul's direct-link-only, unsigned prospect, not for catalogue exposure
- **RUAIH JC build:** placeholder card (status "build") for the JC partnership-tailored RUAIH overlay
- **Future:** when a new offering ships, add its card; when a new tenant signs, add its card (otherwise stays direct-link)

When a new tenant lands, default = NOT listed until it's a signed conversation. AHN can be promoted to the catalogue when Paul signals readiness.

---

## Allowlist (lib/demoHubAllowlist.ts)

- **Domain rule:** `@ateninc.com` users authed at any level
- **Explicit invites (`INVITE_EMAILS`):**
  - Graham (WakeMed)
  - Kelly Davis (WakeMed)
  - Lynn Kenyon (Duke)
  - Diane Rhyne (UNC)
  - Robin Jacob (UNC)
  - Paul Palamara (Pinnacle Mx Group — Allegheny channel)
- **NOT in allowlist:** anonymous public; named hospital admins outside the above; unsigned prospects

Adding a new invitee: append to `INVITE_EMAILS` AND mirror to Supabase Auth → Allowed email addresses (for external domains, both layers required).

---

## Frozen + named-reviewer constraints

| Surface | Reason | Reviewer before change |
|---|---|---|
| `demo.aiwizn.com/` (engine root) | WakeMed live testers | Thomas + Graham — change control review |
| `demo.aiwizn.com/cohort-invite.html` (static) | Graham/Kelly forward URL | Thomas + Graham |
| `demo.aiwizn.com/dashboard.html` admin allow-list | Sue / Graham / Lynn ops | Thomas |
| Top-level engine `index.html`, `defaultConfig.json` | All tenant configs inherit | Thomas + Graham — WakeMed regression check required |
| Tallman / Joint Commission outreach copy | Highest-stakes external positioning | Thomas + Graham + Arvind |
| Brand architecture (AIWIZN sub-brand vs. ATEN parent vs. atenguru) | Strategic / commercial | Open — Phase-2 decision |

---

## Adding a new demo — checklist

When a new tenant lands (e.g. Cincinnati Children's, Cleveland Clinic):

1. **Website repo:** add `<tenant>HealthSystemConfig()` + `<TENANT>_CLINICAL_ENGINE_LINK` to `lib/demoTenantLinks.ts` (additive — never edit existing exports)
2. **Engine repo:** clone `unc/index.html` → `<tenant>/index.html`, swap brand color + chip text + base64 payload (regenerate via jiti)
3. **Website repo:** add to `TENANT_OPTIONS` in `lib/cohortInviteBuilder.ts` so the gated builder includes it
4. **Allowlist:** add named invitees to `INVITE_EMAILS` if external
5. **This Demo Map:** add the row above
6. **Verify:** curl all existing tenant URLs + `/`+ `/cohort-invite.html` (engine) + `/cohort-invite` (website) — all 200, all unchanged

When a new offering lands (AI Readiness, Joint Commission Readiness, finance vertical, etc.):

1. **Engine architecture:** wire `offeringConfigFor(offering)` into the engine boot path so `?offering=ai-readiness` or `/ai-readiness/` selects the scenario set
2. **Engine repo:** clone `unc/index.html` pattern for the new offering's short URL
3. **Website repo:** add the offering to the `/demo` catalogue + the cohort builder offering selector
4. **This Demo Map:** add the row + the planned offering × tenant matrix expansion
5. **Verify:** existing tenant URLs unchanged + new offering URL loads with correct scenario set

---

## Public website surfacing (aiwizn.com — indexable)

The four offerings are surfaced on three public marketing surfaces via the shared `components/sections/offering-matrix.tsx`:

- `/platform` — full matrix with platform framing ("four engines · one platform spine")
- `/for-hospitals` — matrix with hospital framing ("what you can deploy to your floor")
- `/for-schools` — matrix with school framing ("engines your programme can build on")

The matrix surfaces maturity honestly per engine:
- **Live · validated:** Clinical Engine, Patient Care Onboarding
- **Live · default tenant:** AI Readiness Engine, Joint Commission Readiness

Every page renders the locked RUAIH disclaimer footer: *"AIWIZN prepares organisations and people for AI-readiness and accreditation standards including Joint Commission RUAIH. AIWIZN does not confer, certify, issue, or substitute for Joint Commission certification — only the Joint Commission can issue RUAIH."*

The matrix does NOT link to any tenant demo URL — those stay gated to `/demo`, `/demo/new`, and per-tenant cohort links.

---

## Open decisions

- **Brand architecture** — AIWIZN as sub-brand vs. ATEN as multi-vertical parent vs. atenguru.com as consumer face. Phase-2 decision. Tie to the existing ATEN entity-structure conversation. Status: open · framed in the Arvind memo.
- **AHN catalogue promotion** — when does AHN move from Paul's-direct-link-only into the `/demo` hub catalogue. Trigger: signed conversation, not a contact form.
- **Joint Commission outreach** — Tallman reply held until (a) demo URL exists, (b) Graham + Arvind have signed off on the wording.
- **Multi-tenant AI Readiness** — does AHN/UNC/Duke get a tenant-branded AI Readiness URL too, or does AI Readiness stay default-tenant only for Phase 1? Default current answer: Phase 1 stays default-tenant; tenant-branded AI Readiness is a Phase 2 add.

---

**This file is the source of truth.** Any new demo URL, gating change, or frozen-status change updates this file before it ships.
