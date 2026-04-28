# Supabase

This site connects to the **existing AIWIZN Supabase project** (`scyfldezhztapttcyenr`, region `us-east-1`) — the same project that backs the clinical-engine.

## Schema separation

| Schema | Owned by | Purpose |
| --- | --- | --- |
| `aiwizn` | clinical-engine product | scenarios, scenes, sessions, profiles, cohorts, etc. |
| `website` | this codebase | public site data — currently `contact_messages` |
| `auth` | Supabase | shared `auth.users` for both products |
| `public` | shared | minimal — only the `submit_contact_message` RPC for the website |

The website does **not** add or replace triggers on `auth.users`. The existing `on_auth_user_created` trigger continues to populate `aiwizn.profiles` for every signup, so a hospital prospect who signs up on aiwizn.com lands in the same user system as a clinical-engine learner.

## Migrations

Migrations have already been applied via the Supabase MCP. They're checked in here for reproducibility (e.g. when bootstrapping a staging project later). To re-apply manually:

```bash
psql "$SUPABASE_DB_URL" -f supabase/migrations/20260428120000_website_schema_init.sql
psql "$SUPABASE_DB_URL" -f supabase/migrations/20260428120100_website_contact_rpc.sql
```

Or use `supabase db push` if you have the Supabase CLI linked.

## Expected security advisor warnings

The Supabase database linter will flag three things from this codebase:

1. `website.contact_messages` INSERT policy with `WITH CHECK (true)` — intentional. We allow anonymous submissions from the contact form.
2. `public.submit_contact_message` executable by `anon` — intentional. That's how the form posts.
3. Same as 2 for `authenticated`.

If contact-form spam ever becomes an issue, layer Cloudflare Turnstile / hCaptcha in front of the form rather than tightening these policies.

## Auth URL configuration

The dashboard URL settings need to allow the production domain. Open
<https://supabase.com/dashboard/project/scyfldezhztapttcyenr/auth/url-configuration>
and set:

- **Site URL:** `https://www.aiwizn.com`
- **Additional Redirect URLs:**
  - `https://www.aiwizn.com/auth/callback`
  - `https://www.aiwizn.com/**`
  - `http://localhost:3000/auth/callback`
  - `http://localhost:3000/**`
