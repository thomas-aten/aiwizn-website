/**
 * Demo hub access control — Sprint 15.
 *
 * The `/demo` route on www.aiwizn.com is a small, gated catalogue of live
 * engine links for internal admins and a hand-picked invite list of clinical
 * partners. It is NOT linked from nav, NOT indexed, and a hard server-side
 * allow-list check runs before any tenant URL is rendered. Anonymous or
 * non-allowlisted users are redirected away without any info leak about which
 * engines exist or which tenants are provisioned.
 *
 * Two layers to be aware of:
 *
 *   1. The Supabase Auth project-level allowed-domain list governs who can
 *      *create an account / sign in* (ateninc.com + explicit invites). That
 *      is a Supabase Dashboard setting, configured by Thomas — not code here.
 *
 *   2. THIS file is the per-route allow-list for the `/demo` hub itself. A
 *      user might be authenticated against the Supabase project but still not
 *      be on the demo-hub invite list (e.g. a learner at a customer tenant);
 *      they get redirected from `/demo` even though their /dashboard works.
 *
 * Adding a new invitee: append their email (lowercased) to ALLOWED_EMAILS
 * below, and — if they are external — also add the address to Supabase Auth
 * "Allowed email addresses" so the magic-link / signup flow accepts them.
 * See CLAUDE.md for the operator runbook.
 *
 * IMPORTANT — this allow-list does NOT gate the per-tenant demo links
 * themselves. External nurse testers (WakeMed, UNC, Duke evaluators) load
 * `https://demo.aiwizn.com/#config=<base64>` directly with NO Supabase login.
 * The hash carries the tenant config; demo.aiwizn.com reads it client-side.
 * Tightening this list is therefore safe for those external tester paths.
 */

const ALLOWED_DOMAINS = ["ateninc.com"] as const;

/**
 * Explicit invite list — additional addresses outside the ateninc.com domain
 * that may access /demo. Mirror this list in Supabase Auth → Sign-in/Providers
 * → Allowed email addresses so the magic-link / signup flow accepts them.
 *
 * Source of truth for the invite list lives in `customer_users` (the seeded
 * customers admin/educator rows); this constant is a denormalized copy used
 * by the gating check so we don't take a Supabase round-trip on every request.
 *
 * Sprint 15 invite list:
 *   - Graham Atkinson (WakeMed)         — current active tester
 *   - Kelly McNiff (WakeMed)            — current active tester
 *   - Lynn Kenyon (Duke)                — completed session via WakeMed link
 *   - Diane Rhyne (UNC / Care Support)  — clinical advisor
 *   - Robin Jacob (UNC clinical lead)   — clinical advisor
 *   - Paul Palamara (Pinnacle Mx Group) — sales channel partner
 */
const INVITE_EMAILS: readonly string[] = [
  "graham@wakemed.org",
  "kelly.mcniff@wakemed.org",
  "lynn.kenyon@duke.edu",
  "diane.rhyne@unchealth.unc.edu",
  "robin.jacob@unchealth.unc.edu",
  "palamara@pinnaclemx.com",  // Paul Palamara · Pinnacle Mx Group · sales channel partner · added 2026-06-21
  // Dr. Graham Snyder (WakeMed CIL · clinical advisor) — added 2026-07-01. Gmail address;
  // Gmail ignores dots in the local part, so we accept both the dotted + non-dotted
  // literal here AND normalize gmail addresses in isDemoHubAllowed() as belt-and-suspenders.
  // auth.users has the non-dotted form (grahamesnyder@gmail.com, created 2026-06-12); the
  // normalizer makes the check succeed no matter which form he types into the magic-link box.
  "grahamesnyder@gmail.com",
  "graham.e.snyder@gmail.com",
  // TODO(2026-06-30) — add Arvind Kumar's evaluator email (EisnerAmper, RUAIH Org Readiness
  // engine reviewer). Hash-link demo path at demo.aiwizn.com/ruaih-readiness/ works for him
  // without /demo hub access; this entry is for hub access only. Awaiting exact address
  // from Thomas. Format: <name>@eisneramper.com (lowercased).
];

/**
 * Gmail treats a local-part with dots and without dots as the same address
 * (grahamesnyder@gmail.com === graham.e.snyder@gmail.com), and ignores
 * everything after a "+". Normalize both so a dotted sign-in attempt still
 * matches a non-dotted invite-list entry (and vice versa). Only applies to
 * gmail.com / googlemail.com — every other provider treats dots as significant.
 *
 * Reference: https://support.google.com/mail/answer/7436150
 */
function normalizeEmail(raw: string): string {
  const e = raw.trim().toLowerCase();
  if (!e.includes("@")) return e;
  const [localRaw, domain] = e.split("@", 2);
  if (domain !== "gmail.com" && domain !== "googlemail.com") return e;
  // Strip everything from the first "+" and remove all dots from the local part.
  const local = localRaw.split("+", 1)[0].replace(/\./g, "");
  return local + "@gmail.com"; // normalize googlemail → gmail too, since Google routes both
}

const INVITE_SET = new Set(INVITE_EMAILS.map((e) => normalizeEmail(e)));

/**
 * Returns true iff `email` is allowed to access the gated /demo hub.
 * Domain match (ateninc.com) OR an explicit invite-list address (with Gmail
 * dot/+ normalization so `graham.e.snyder@gmail.com` and
 * `grahamesnyder@gmail.com` both match).
 *
 * Returns false for null/undefined/empty input — never throws.
 */
export function isDemoHubAllowed(email: string | null | undefined): boolean {
  if (!email || typeof email !== "string") return false;
  const e = email.trim().toLowerCase();
  if (!e || !e.includes("@")) return false;

  const domain = e.split("@", 2)[1];
  if (domain && (ALLOWED_DOMAINS as readonly string[]).includes(domain)) {
    return true;
  }

  return INVITE_SET.has(normalizeEmail(e));
}

/** Exposed for the CLAUDE.md operator runbook + admin diagnostics only. */
export function listDemoHubInvitees(): readonly string[] {
  return INVITE_EMAILS;
}

export function listAllowedDomains(): readonly string[] {
  return ALLOWED_DOMAINS;
}
