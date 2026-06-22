# CLAUDE.md — aiwizn-website operator notes

Persistent notes for agents working in this repo. Keep terse, factual, and
current. If a section drifts out of date, fix the section rather than appending
a contradiction.

## Hard constraints

- **WakeMed external-tester link is FROZEN.** Nurses (Graham, Kelly, Lynn
  Kenyon at Duke, and others) are using `https://demo.aiwizn.com/#config=<base64>`
  links via Graham/Kelly forwards. The link mechanism is the URL-hash payload
  established in Sprint 2 — see `lib/demoTenantLinks.ts`. Any change to the
  shared `demo.aiwizn.com` engine origin, the hash-decoder behaviour, or the
  `protocol_configs` schema is a regression risk. Read first, clone second,
  never edit WakeMed's config in place. If a change *would* require touching
  the shared engine code path, stop and flag to Thomas.
- **No `github.io` URLs** anywhere in `app/`, `lib/`, `components/`. The
  thomas-aten.github.io mirrors of the clinical engine and the investor
  brief were retired in Sprint 15. Validate with
  `grep -rn 'github.io' app/ lib/ components/` before merging.

## /demo gated hub

`app/demo/page.tsx` — server-rendered, robots-noindex, three-gate access
control:

1. Anonymous → redirect to `/login?next=/demo`.
2. Authenticated but not on the invite list → redirect to `/` (no info leak).
3. Authenticated + allow-listed → renders the engine catalogue.

The allow-list lives in `lib/demoHubAllowlist.ts`. Two layers:

- Domain match: `ateninc.com`.
- Explicit invite list: see `INVITE_EMAILS` in that file. Sprint 15 cohort —
  Graham (WakeMed), Kelly (WakeMed), Lynn Kenyon (Duke), Diane Rhyne (UNC),
  Robin Jacob (UNC).

**Adding a new invitee:**

1. Append the lowercased email to `INVITE_EMAILS` in `lib/demoHubAllowlist.ts`.
2. If the user is external, mirror the address in the Supabase project's
   Auth → Sign-in/Providers → "Allowed email addresses" list so the
   magic-link / signup flow will accept the address.
3. Commit the change with a short note in the message: who and why.

This list does **not** gate the external-tester per-tenant demo links — those
are URL-hash links anyone with the URL can open. It only gates `/demo` itself
(the directory page).

## Per-tenant demo links

`lib/demoTenantLinks.ts` builds `https://demo.aiwizn.com/#config=<base64>`
URLs from `ProtocolConfigV11` payloads. The same mechanism is used
server-side by `app/(app)/dashboard/engines/[slug]/page.tsx` for
authenticated tenant users; the difference is that the external-tester links
inline the config at build time instead of reading from `protocol_configs`.

Provisioned tenants:

- Demo Hospital — `DEMO_HOSPITAL_CLINICAL_ENGINE_LINK`.
- UNC Medical Center — `UNC_CLINICAL_ENGINE_LINK` (Sprint 15).
- WakeMed — payload lives in the clinical engine repo / Supabase
  `protocol_configs`. Do not regenerate.

## C1 — Supabase Auth allow-domain hardening (held / partial)

Tightening Supabase Auth → Sign-in/Providers → "Allowed email domains" to
`ateninc.com` plus the explicit invite list is a Supabase Dashboard setting
(not code). Status as of Sprint 15:

- Code-side allow-list (`lib/demoHubAllowlist.ts`) is in place and gates
  `/demo`. This is the layer the brief calls "C1 hardening" implemented at
  the route level.
- Supabase project-level setting NOT yet applied. Before applying it, confirm
  no external-tester flow depends on creating a Supabase account at a
  non-allow-listed domain. The WakeMed/UNC external-tester path does NOT
  require Supabase Auth (the hash carries the config; the engine runs without
  login), so the project-level tightening is safe on that axis — but a future
  partner who needs to log into the /dashboard surface from a non-ateninc.com
  address must be added to both layers.
