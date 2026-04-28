# Deployment runbook — aiwizn.com

This runbook takes the `aiwizn-website` codebase from "freshly cloned" to "live at https://www.aiwizn.com" with Supabase auth working in production.

The codebase has already been committed locally (`git log` shows the initial commit). Steps below are the bits that require your hands-on access to GitHub, Supabase, Vercel, and GoDaddy.

---

## 1 · Push to GitHub (≈ 2 min)

You'll create the repo on github.com, then push your local commit.

### 1a · Create the empty repo on GitHub

Open <https://github.com/new> and fill in:

| Field | Value |
| --- | --- |
| Owner | **thomas-aten** |
| Repository name | **aiwizn-website** |
| Description | Public marketing + auth site for AIWIZN. |
| Visibility | Private (recommended) or Public |
| Initialize with README | **No** (we already have one) |
| Add .gitignore | **None** |
| License | **None** |

Click **Create repository**.

### 1b · Push from your machine

Open Terminal and run (paste verbatim — the directory matches the workspace this codebase was generated in):

```bash
cd "$HOME/Library/Application Support/Claude/local-agent-mode-sessions/3606dc69-c5b4-4c72-9ec4-68a24dd3b6a9/9bc967b6-9f94-42fb-a7e2-e766b029579e/local_8a53d6bf-9037-416d-8a68-84f6fa2b1e6f/outputs/aiwizn-website"

# The sandbox left a partial .git directory with stuck lock files —
# wipe and re-init for a clean single-commit history.
rm -rf .git
git init -b main
git config user.email "thomas@ateninc.com"
git config user.name "Thomas K Vaidhyan"
git add -A
git commit -m "Initial commit: aiwizn-website"

git remote add origin https://github.com/thomas-aten/aiwizn-website.git
git push -u origin main
```

> **Note:** if you'd rather move the project somewhere tidier first (e.g. `~/code/aiwizn-website`), copy the folder there before running the commands above. The path is just where the scaffold landed — git doesn't care where the repo lives.

If GitHub asks for credentials, use a **personal access token** (Classic, scope `repo`) generated at <https://github.com/settings/tokens>.

You should now see your code at <https://github.com/thomas-aten/aiwizn-website>.

---

## 2 · Supabase — already wired up

We're using the **existing AIWIZN Supabase project** (`scyfldezhztapttcyenr`, region `us-east-1`). Two migrations have already been applied:

| Migration | What it adds |
| --- | --- |
| `website_schema_init` | New `website` schema + `website.contact_messages` table with RLS |
| `website_contact_rpc` | `public.submit_contact_message` RPC the site calls with the anon key |

The existing `aiwizn` schema and its `on_auth_user_created` trigger are untouched, so signups from the new site will continue to flow into `aiwizn.profiles` exactly as they do for the clinical-engine.

The connection values are already in `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://scyfldezhztapttcyenr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_XVqZASfCKdWY-lOwnJOgvw_KN2nunZ5
```

### One thing you DO still need to do in the Supabase dashboard

Open <https://supabase.com/dashboard/project/scyfldezhztapttcyenr/auth/url-configuration> and set:

- **Site URL:** `https://www.aiwizn.com`
- **Additional Redirect URLs** (add each on its own line):
  - `https://www.aiwizn.com/auth/callback`
  - `https://www.aiwizn.com/**`
  - `http://localhost:3000/auth/callback`
  - `http://localhost:3000/**`

Without this, magic-link / email-verification redirects from production won't be allowed.

Optional but recommended:
- **Authentication → Providers → Email:** require email confirmation.
- **Authentication → Email Templates:** edit the "Confirm signup" / "Magic link" templates to match the AIWIZN voice (if you want — defaults work fine).

---

## 3 · Deploy to Vercel (≈ 3 min)

1. Sign in / sign up at <https://vercel.com> (use your GitHub account).
2. **Add New → Project**.
3. **Import Git Repository** → pick `thomas-aten/aiwizn-website`.
4. Framework preset: **Next.js** (auto-detected). Leave the build command, output dir, install command on their defaults.
5. Click **Environment Variables** and add three (these connect to the existing AIWIZN Supabase project):

| Name | Value |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://scyfldezhztapttcyenr.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `sb_publishable_XVqZASfCKdWY-lOwnJOgvw_KN2nunZ5` |
| `NEXT_PUBLIC_SITE_URL` | `https://www.aiwizn.com` |

Apply each to **Production**, **Preview**, and **Development**.

6. Click **Deploy**. Wait ~90 seconds. Vercel will give you a URL like `aiwizn-website-xyz.vercel.app` — open it and confirm the home page renders.

---

## 4 · Add aiwizn.com as a custom domain (≈ 2 min)

In Vercel: **Project → Settings → Domains** → **Add**.

Add **both** of these, one at a time:

1. `www.aiwizn.com` — Vercel will mark this as the **primary** domain.
2. `aiwizn.com` — Vercel will offer to redirect this to the `www` version. Accept.

For each domain, Vercel will display the DNS record(s) you need to set on GoDaddy. The values are stable but **always copy them from Vercel's screen** to be safe — they may show region-specific CNAMEs.

The expected values (Vercel defaults — verify in the UI):

| Domain | Type | Name / Host | Value |
| --- | --- | --- | --- |
| `aiwizn.com` (apex) | A | `@` | `76.76.21.21` |
| `www.aiwizn.com` | CNAME | `www` | `cname.vercel-dns.com` |

---

## 5 · Update GoDaddy DNS (≈ 5 min + propagation)

1. Sign in at <https://dcc.godaddy.com>.
2. Find **aiwizn.com** in *My Products* → click **DNS**.
3. **Remove conflicting records first.** Look for and delete:
   - Any **A** record on `@` pointing to GoDaddy's parking IP (often `1.1.1.1`, `34.102.136.180`, `13.248.243.5`, `76.223.105.230`, or similar).
   - Any **CNAME** on `www` pointing to `_domainconnect.gd.domaincontrol.com` or to GoDaddy's own DNS.
   - Any **forwarding** rule (Settings → Forwarding) — turn it OFF, otherwise GoDaddy keeps overriding your DNS.
4. **Add the Vercel records:**
   - **Add → A:** Name `@`, Value `76.76.21.21`, TTL **600 seconds** (or 1 hour).
   - **Add → CNAME:** Name `www`, Value `cname.vercel-dns.com`, TTL **1 hour**.
5. Save.

DNS usually propagates within 10–30 min (sometimes sooner for new records). You can check in another terminal:

```bash
dig +short aiwizn.com
dig +short www.aiwizn.com
```

The first should return `76.76.21.21`. The second should resolve through `cname.vercel-dns.com` to a Vercel IP.

Once Vercel detects the records, the **Domains** page will flip to ✅ and Vercel will provision a Let's Encrypt certificate automatically (~30 sec).

---

## 6 · Verify in production

Open these and confirm:

- <https://www.aiwizn.com> — home page renders, lock icon green.
- <https://aiwizn.com> — redirects to `www`.
- <https://www.aiwizn.com/platform> — platform page renders.
- <https://www.aiwizn.com/login> — login form renders.
- Click **Get access** → fill the signup form with a real email → check inbox for the confirmation link → click it → you should land on `/dashboard`.
- Check Supabase Dashboard → **Authentication → Users** — your signup should appear.

---

## 7 · Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| `aiwizn.com` shows GoDaddy parking page | Conflicting A record left in place | Delete every `@` A record except `76.76.21.21` |
| Vercel shows "Invalid Configuration" on the domain | DNS not propagated yet | Wait 15 min, click **Refresh** in Vercel |
| Signup email never arrives | Supabase Site URL not set, or SMTP not configured | Set Site URL to `https://www.aiwizn.com`; for production email volume, configure custom SMTP in Supabase |
| Auth callback errors out | Redirect URL not whitelisted in Supabase | Add `https://www.aiwizn.com/auth/callback` to Authentication → URL Configuration → Redirect URLs |
| Build fails on Vercel | Missing env var | Confirm all three `NEXT_PUBLIC_*` vars exist in Vercel → Settings → Environment Variables |

---

## 8 · Future updates

Edit, commit, push:

```bash
git add -A
git commit -m "describe the change"
git push
```

Vercel auto-deploys every push to `main`. PRs get preview URLs automatically.
