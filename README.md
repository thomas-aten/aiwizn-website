# aiwizn-website

Public marketing + auth site for **AIWIZN** — the AI-driven nursing education and competency mastery platform from Aten Inc.

> **The Wisdom of Expert Nurses, Captured. Scaled. Deployed.**
> *Imagination Unlimited.*

Production: <https://www.aiwizn.com>

---

## Stack

- **Framework:** Next.js 14 (App Router) · TypeScript · React 18
- **Styling:** Tailwind CSS 3 · Cormorant Garamond / Outfit / DM Mono
- **Auth:** Supabase Auth (email + magic link), via `@supabase/ssr`
- **Hosting:** Vercel
- **DNS:** GoDaddy → Vercel

## Project structure

```
app/
  (marketing)/         # public site (home, platform, hospitals, schools, about, investors, contact)
    layout.tsx
    page.tsx           # /
    platform/page.tsx
    for-hospitals/page.tsx
    for-schools/page.tsx
    about/page.tsx
    investors/page.tsx
    contact/page.tsx
  (auth)/              # login, signup, forgot-password
    layout.tsx
    login/page.tsx
    signup/page.tsx
    forgot-password/page.tsx
  (app)/               # signed-in workspace, protected by middleware
    layout.tsx
    dashboard/page.tsx
  auth/callback/       # Supabase OAuth / magic-link / email-verify callback
    route.ts
  globals.css
  layout.tsx
  not-found.tsx
components/
  sections/            # hero, problem, flywheel, agents, team, cta
  auth/                # login-form, signup-form, sign-out-button
  site-header.tsx
  site-footer.tsx
  wordmark.tsx
lib/
  supabase/            # client.ts, server.ts, middleware.ts
  agents.ts            # the 10 AIWIZN agents (PRAXIS … CONTINUUM)
  utils.ts
middleware.ts          # refreshes Supabase session, gates /dashboard/*
public/
  favicon.svg
```

## Local development

Requires Node ≥ 18.

```bash
cp .env.example .env.local
# fill NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
npm install
npm run dev
```

The site runs on <http://localhost:3000>. Auth requires a working Supabase project; without it, the marketing pages still render and the middleware short-circuits.

### Required env vars

| Variable | Where to get it |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Project Settings → API |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` locally · `https://www.aiwizn.com` in prod |

In your Supabase project, set **Auth → URL Configuration**:
- **Site URL:** `https://www.aiwizn.com`
- **Redirect URLs:** add `https://www.aiwizn.com/auth/callback` and `http://localhost:3000/auth/callback`

## Scripts

```bash
npm run dev        # local dev server
npm run build      # production build
npm run start      # serve production build
npm run lint       # eslint
npm run typecheck  # tsc --noEmit
```

## Deployment — Vercel + GoDaddy DNS for aiwizn.com

1. **Push to GitHub** at `https://github.com/thomas-aten/aiwizn-website` (this is a fresh, separate repo from `aiwizn-clinical-engine` and `aiwizn-investor-brief`).
2. **Import to Vercel:** New Project → Import GitHub repo → leave all Next.js defaults.
3. **Add env vars** in Vercel → Project → Settings → Environment Variables (Production + Preview):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SITE_URL=https://www.aiwizn.com`
4. **Add custom domain:** Vercel → Project → Settings → Domains → add `aiwizn.com` and `www.aiwizn.com`. Vercel will display the records to set.
5. **GoDaddy DNS** — log in at <https://dcc.godaddy.com>, open *DNS* for **aiwizn.com**, then:
   - **A**  `@`  →  `76.76.21.21` (Vercel apex)
   - **CNAME**  `www`  →  `cname.vercel-dns.com.` (Vercel www)
   - Remove any conflicting parking / forwarding records on `@` and `www`.
6. **Wait** for DNS propagation (typically <30 min). Vercel will provision SSL automatically.
7. **Verify** — `https://www.aiwizn.com` should serve this site, `https://aiwizn.com` should redirect to `www`, and the lock icon should be green.

## Brand reference

Drawn from the public investor brief at <https://thomas-aten.github.io/aiwizn-investor-brief/> and the clinical-engine demo at <https://thomas-aten.github.io/aiwizn-clinical-engine/>.

| Token | Value |
| --- | --- |
| Teal (primary) | `#00A87A` (dark `#007A5E`) |
| Gold | `#C8920A` |
| Orange | `#D94B12` |
| Purple | `#7C5CBF` |
| Ink (text) | `#0A1826` |
| Cream (bg) | `#F5EFE0` (light `#FBF8EF`) |
| Display font | Cormorant Garamond |
| Body font | Outfit |
| Mono / labels | DM Mono |

## License

All Rights Reserved · © 2026 Aten Inc. See [LICENSE](./LICENSE).
