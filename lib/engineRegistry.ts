/**
 * Engine registry — the single source of truth mapping an engine `slug` to the
 * app it embeds. The generic `/dashboard/engines/[slug]` route resolves the
 * embed URL from here; unknown slugs 404.
 *
 * Some engines (e.g. jc2026) keep a dedicated route under
 * `/dashboard/engines/<slug>/page.tsx`. Next.js matches the static segment
 * before the dynamic `[slug]` segment, so those slugs are served by their own
 * route and never reach the generic page. We still list them here (with
 * `dedicatedRoute` instead of `engineUrl`) so the registry stays a complete
 * catalogue and the generic route can redirect defensively if it ever does
 * receive one.
 */

export type EngineEntry = {
  slug: string;
  title: string;
  /**
   * URL of the engine app to embed in the iframe. Required for engines served
   * by the generic [slug] route. Omitted when `dedicatedRoute` is set.
   */
  engineUrl?: string;
  /**
   * Path to a dedicated route that owns rendering for this slug. When set, the
   * generic [slug] route redirects here instead of embedding `engineUrl`.
   */
  dedicatedRoute?: string;
};

export const ENGINE_REGISTRY: Record<string, EngineEntry> = {
  "clinical-engine": {
    slug: "clinical-engine",
    title: "Clinical Engine",
    engineUrl: "https://demo.aiwizn.com/",
  },
  jc2026: {
    slug: "jc2026",
    title: "JC 2026 Engine",
    // Served by app/(app)/dashboard/engines/jc2026/page.tsx — Next prefers the
    // specific segment over [slug].
    dedicatedRoute: "/dashboard/engines/jc2026",
  },
  "care-support": {
    slug: "care-support",
    title: "Care Support",
    engineUrl: "https://demo.aiwizn.com/cna-onboarding.html",
  },
};

/** Look up an engine by slug. Returns undefined for unknown slugs. */
export function getEngine(slug: string): EngineEntry | undefined {
  return ENGINE_REGISTRY[slug];
}

/**
 * Minimal default config used when the Supabase tables that hold per-tenant
 * config don't exist yet (they're being provisioned in parallel). Keeps the
 * engine bootable with a safe, generic shape until real config lands.
 */
export function defaultEngineConfig(slug: string) {
  return {
    tenant: "AIWIZN Demo Hospital",
    engineSlug: slug,
    version: 0,
    source: "default" as const,
    settings: {},
  };
}
