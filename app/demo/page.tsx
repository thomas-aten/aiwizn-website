import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isDemoHubAllowed } from "@/lib/demoHubAllowlist";
import {
  UNC_CLINICAL_ENGINE_LINK,
  CARE_SUPPORT_ENGINE_LINK,
  DEMO_HOSPITAL_CLINICAL_ENGINE_LINK,
} from "@/lib/demoTenantLinks";

/**
 * /demo — Sprint 15 gated demo hub.
 *
 * Server-rendered. Three gates run BEFORE any tenant link is rendered:
 *
 *   1. Anonymous (no Supabase session)            → redirect to /login.
 *   2. Authenticated but not on the invite list   → 403, no info leak.
 *   3. Authenticated + allow-listed               → render the engine cards.
 *
 * The per-tenant engine URLs themselves are public (the demo.aiwizn.com hash
 * mechanism — see lib/demoTenantLinks.ts), but we never want this *hub* page
 * to be a public directory of which tenants we've provisioned or which
 * engines are in flight.
 */

export const metadata: Metadata = {
  title: "Demo hub",
  description: "Internal — gated engine catalogue.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false, noimageindex: true },
  },
};

// Disable static generation — the auth gate must run on every request.
export const dynamic = "force-dynamic";

type EngineCard = {
  id: string;
  status: "live" | "build" | "soon";
  title: string;
  blurb: string;
  meta?: string;
  href?: string;
};

// AI Readiness Engine (ARI) ships at demo.aiwizn.com/ai-readiness/ but is NOT
// surfaced in the public catalogue yet — per the Demo Map open decision, default
// is unlisted until Thomas + Arvind decide. Flip this flag to true to reveal the
// card once that call is made. (Build: AI Readiness Engine v1, Phase 1.)
const SHOW_AI_READINESS = false;

function buildCards(): EngineCard[] {
  return [
    ...(SHOW_AI_READINESS
      ? [
          {
            id: "ai-readiness",
            status: "live" as const,
            title: "AI Readiness Engine (ARI)",
            blurb:
              "Scenario-based assessment of how staff reason about AI at the point of care — governance, bias recognition, failure-mode response, disclosure judgment, and escalation discipline. Produces an AI Readiness Index (ARI). Prepares for AI-readiness standards incl. Joint Commission RUAIH; does NOT issue RUAIH certification.",
            meta: "ARI · 5 domains · RUAIH Readiness",
            href: "https://demo.aiwizn.com/ai-readiness/",
          },
        ]
      : []),
    {
      id: "nurse-wisdom-index",
      status: "live",
      title: "Nurse Wisdom Index",
      blurb:
        "Clinical-judgement assessment across the high-acuity trio — cardiac (STEMI), stroke, and sepsis. The flagship clinical engine, with Demo Hospital branding for the walk-up evaluation flow.",
      meta: "Demo Hospital · Cardiac · Stroke · Sepsis",
      href: DEMO_HOSPITAL_CLINICAL_ENGINE_LINK,
    },
    {
      id: "patient-care-onboarding",
      status: "live",
      title: "Patient Care Onboarding Engine",
      blurb:
        "Care-support staff (CNA / PCT / PCA) onboarding — 8 elements, 37 checkpoints, 12 decision nodes. Bedside scope-of-practice scaffolding for first-90-days care assistants.",
      meta: "8 elements · 37 checkpoints · 12 decision nodes",
      href: CARE_SUPPORT_ENGINE_LINK,
    },
    {
      id: "jc-2026",
      status: "live",
      title: "Joint Commission Readiness",
      blurb:
        "Train and assess against the Joint Commission 2026 standards. Engine surface lives inside the dashboard so it inherits the tenant's protocol config and audit trail.",
      meta: "JC2026 · Internal workspace",
      href: "/dashboard/engines/jc2026",
    },
    {
      id: "ruaih-jc",
      status: "build",
      title: "RUAIH JC build",
      blurb:
        "Joint-Commission-tailored build for the RUAIH partnership — in-progress configuration of the JC2026 engine with RUAIH protocol overlays. Placeholder card while the tenant config is staged.",
      meta: "RUAIH · In progress",
    },
    {
      id: "unc-medical-center",
      status: "live",
      title: "UNC Medical Center — clinical engine",
      blurb:
        "UNC Health-branded clinical engine for the three high-acuity scenarios (sepsis, acute MI, stroke). Carolina Blue accent, UNC Medical Center display, UNC Health Interpreter Services terminology. External tester link.",
      meta: "UNC · Cardiac · Stroke · Sepsis",
      href: UNC_CLINICAL_ENGINE_LINK,
    },
    {
      id: "coming-soon-1",
      status: "soon",
      title: "+ Coming soon",
      blurb:
        "Additional engines in the queue — protocol fluency, medication-administration safety, and the post-orientation longitudinal track.",
    },
    {
      id: "coming-soon-2",
      status: "soon",
      title: "+ Coming soon",
      blurb:
        "Reserved slot. Tell Thomas which engine you want to see surfaced here next.",
    },
  ];
}

function CardChrome({ card }: { card: EngineCard }) {
  const dot =
    card.status === "live"
      ? "● Live"
      : card.status === "build"
        ? "● In progress"
        : "○ Coming soon";

  const dotClass =
    card.status === "live"
      ? "text-teal-dark"
      : card.status === "build"
        ? "text-orange"
        : "text-ink-3";

  const body = (
    <>
      <p
        className={`font-mono text-[10px] uppercase tracking-label ${dotClass}`}
      >
        {dot}
      </p>
      <h2 className="mt-3 font-display text-2xl text-ink md:text-3xl">
        {card.title}
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-ink-2">{card.blurb}</p>
      {card.meta && (
        <p className="mt-4 font-mono text-[10px] uppercase tracking-label text-ink-3">
          {card.meta}
        </p>
      )}
      {card.href && (
        <p className="mt-6 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-label text-ink-2 transition group-hover:text-teal-dark">
          {card.href.startsWith("/") ? "Open in dashboard →" : "Open engine ↗"}
        </p>
      )}
    </>
  );

  const className = `card group block overflow-hidden p-8 transition ${
    card.status === "live"
      ? "border-teal/20 hover:border-teal/60 hover:shadow-md"
      : card.status === "build"
        ? "border-orange/30"
        : "border-ink/10 opacity-70"
  }`;

  if (!card.href) {
    return (
      <div className={className} aria-disabled="true">
        {body}
      </div>
    );
  }

  // Internal /dashboard/* links go through Next.js routing; external
  // demo.aiwizn.com tenant URLs open in a new tab.
  if (card.href.startsWith("/")) {
    return (
      <Link href={card.href} className={className}>
        {body}
      </Link>
    );
  }

  return (
    <a
      href={card.href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    >
      {body}
    </a>
  );
}

export default async function DemoHubPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Gate 1 — anonymous: send to /login with a redirect-back so they land here
  // after sign-in if they end up allow-listed.
  if (!user) redirect("/login?next=/demo");

  // Gate 2 — authenticated but not allow-listed. The redirect target is the
  // marketing root rather than a 403 page so we don't disclose anything about
  // the hub's existence. From a non-allow-listed user's perspective, /demo
  // simply doesn't navigate anywhere interesting.
  if (!isDemoHubAllowed(user.email)) redirect("/");

  const cards = buildCards();

  return (
    <main className="min-h-screen bg-cream-light">
      <div className="container py-16 md:py-24">
        <p className="label">Internal · Demo hub</p>
        <h1 className="mt-3 max-w-3xl font-display text-4xl leading-[1.05] text-ink md:text-6xl">
          AIWIZN engine catalogue.
        </h1>
        <p className="mt-6 max-w-prose text-lg leading-relaxed text-ink-2">
          Live engine links for internal review and partner walkthroughs. Each
          card is a per-tenant or per-engine surface — partner links carry
          their tenant config in the URL hash and load without sign-in.
        </p>
        <p className="mt-6 inline-flex rounded-full border border-ink/15 bg-white/60 px-3 py-1 font-mono text-[10px] uppercase tracking-label text-ink-2">
          Confidential · Do not redistribute
        </p>

        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {cards.map((c) => (
            <CardChrome key={c.id} card={c} />
          ))}
        </div>

        <div className="mt-16 border-t border-ink/10 pt-8">
          <p className="font-mono text-[10px] uppercase tracking-label text-ink-3">
            Signed in as {user.email}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-ink-3">
            Access is restricted to ateninc.com staff and a small invite list
            of clinical partners. To add a new invitee, see CLAUDE.md.
          </p>
        </div>
      </div>
    </main>
  );
}
