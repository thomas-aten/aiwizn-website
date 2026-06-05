import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasActiveEnginesSubscription } from "@/lib/entitlement";
import { defaultEngineConfig, getEngine } from "@/lib/engineRegistry";
import { EngineFrame } from "./engine-frame";

export const metadata: Metadata = {
  title: "Engine",
  robots: { index: false, follow: false },
};

// AIWIZN Demo Hospital — the tenant whose seed config we fall back to when an
// assigned customer has no protocol_config row for the requested engine yet.
const DEMO_HOSPITAL_ID = "00000000-0000-0000-0000-000000000001";

type ConfigResult =
  // Render the engine with this config payload.
  | { status: "ready"; config: unknown }
  // User is authenticated/entitled but not mapped to any customer → empty state.
  | { status: "unassigned" };

/**
 * Read the current protocol_config for a (customer, engine) pair.
 *
 * Returns `undefined` when the table is missing (it's being provisioned in a
 * parallel track), when the query errors, or when no row exists — every one of
 * those means "no config here, try the next fallback". supabase-js returns
 * `{ data, error }` instead of throwing, so a missing table surfaces as `error`
 * (Postgres 42P01 / PostgREST PGRST205) rather than a crash.
 */
async function loadProtocolConfig(
  supabase: ReturnType<typeof createClient>,
  customerId: string,
  slug: string,
): Promise<unknown | undefined> {
  const { data, error } = await supabase
    .from("protocol_configs")
    .select("config_json")
    .eq("customer_id", customerId)
    .eq("engine_slug", slug)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.warn(
      "[engines/[slug]] protocol_configs unavailable:",
      error.message,
    );
    return undefined;
  }
  return data?.config_json ?? undefined;
}

/**
 * Resolve the config to inject into the engine for the current user.
 *
 *   1. Look up the user's customer_id in `customer_users`.
 *        • table missing / query error → degrade gracefully: boot with the
 *          hardcoded default config so the engine still works today.
 *        • table present but no row → user has no tenant → friendly empty state.
 *   2. Read the tenant's current config from `protocol_configs`.
 *   3. No row for the tenant → fall back to the Demo Hospital seed config.
 *   4. Still nothing → hardcoded minimal default.
 */
async function resolveConfig(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  slug: string,
): Promise<ConfigResult> {
  // Step 1: customer assignment.
  const { data: assignment, error: assignmentError } = await supabase
    .from("customer_users")
    .select("customer_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (assignmentError) {
    // Table not provisioned yet (parallel migration) or transient error — keep
    // the engine bootable rather than blocking the user.
    console.warn(
      "[engines/[slug]] customer_users unavailable, using default config:",
      assignmentError.message,
    );
    return { status: "ready", config: defaultEngineConfig(slug) };
  }

  if (!assignment?.customer_id) {
    // Authenticated and entitled, but not attached to any customer.
    return { status: "unassigned" };
  }

  const customerId = assignment.customer_id as string;

  // Step 2: the tenant's own current config.
  const own = await loadProtocolConfig(supabase, customerId, slug);
  if (own !== undefined) return { status: "ready", config: own };

  // Step 3: Demo Hospital seed config (skip if the tenant *is* the demo).
  if (customerId !== DEMO_HOSPITAL_ID) {
    const demo = await loadProtocolConfig(supabase, DEMO_HOSPITAL_ID, slug);
    if (demo !== undefined) return { status: "ready", config: demo };
  }

  // Step 4: hardcoded default.
  return { status: "ready", config: defaultEngineConfig(slug) };
}

function EngineChrome({
  title,
  children,
  openUrl,
}: {
  title: string;
  children: React.ReactNode;
  openUrl?: string;
}) {
  return (
    <div className="-mx-5 -my-12 md:-mx-8 lg:-mx-12">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/10 bg-cream-light/70 px-5 py-3 md:px-8 lg:px-12">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-label text-ink-3">
            Workspace · Engine
          </p>
          <h1 className="mt-0.5 font-display text-xl text-ink">{title}</h1>
        </div>
        <div className="flex items-center gap-3">
          {openUrl && (
            <a
              href={openUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary"
            >
              Open in new tab ↗
            </a>
          )}
          <Link href="/dashboard/engines" className="btn-ghost text-ink-3 hover:text-ink">
            ← Engines
          </Link>
        </div>
      </div>
      <div className="relative h-[calc(100vh-7rem)] w-full bg-ink/5">{children}</div>
    </div>
  );
}

export default async function EngineSlugPage({
  params,
}: {
  params: Promise<{ slug: string }> | { slug: string };
}) {
  const { slug } = await Promise.resolve(params);

  const engine = getEngine(slug);
  // Unknown slug → 404.
  if (!engine) notFound();

  // Slug owned by a dedicated route (e.g. jc2026). Next routes the static
  // segment first so we shouldn't normally land here, but redirect defensively.
  if (engine.dedicatedRoute) redirect(engine.dedicatedRoute);

  // Must have an embed URL to render the generic frame.
  if (!engine.engineUrl) notFound();

  // Paywall — consistent with the dedicated engine routes (jc2026, clinical).
  const entitled = await hasActiveEnginesSubscription();
  if (!entitled) redirect("/pricing?reason=subscribe");

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Middleware already gates /dashboard, but guard defensively.
  if (!user) redirect(`/login?next=/dashboard/engines/${slug}`);

  const result = await resolveConfig(supabase, user.id, slug);

  // Friendly empty state: signed in, entitled, but no customer assignment.
  if (result.status === "unassigned") {
    return (
      <EngineChrome title={engine.title}>
        <div className="absolute inset-0 flex items-center justify-center px-6">
          <div className="card max-w-md border-teal/20 p-8 text-center">
            <p className="font-mono text-[10px] uppercase tracking-label text-teal-dark">
              ● No workspace yet
            </p>
            <h2 className="mt-3 font-display text-2xl text-ink">
              You&rsquo;re not attached to an organization
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-ink-2">
              Your account isn&rsquo;t linked to a customer workspace yet, so we
              can&rsquo;t load this engine&rsquo;s configuration. Ask your AIWIZN
              administrator to add you, or contact us to get set up.
            </p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <Link href="/contact" className="btn-primary">
                Contact AIWIZN
              </Link>
              <Link href="/dashboard/engines" className="btn-ghost text-ink-3 hover:text-ink">
                ← Engines
              </Link>
            </div>
          </div>
        </div>
      </EngineChrome>
    );
  }

  // Inject config into the engine via the URL hash: #config=<base64(json)>.
  const encodedConfig = Buffer.from(JSON.stringify(result.config)).toString(
    "base64",
  );
  const src = `${engine.engineUrl}#config=${encodedConfig}`;
  const engineOrigin = new URL(engine.engineUrl).origin;

  return (
    <EngineChrome title={engine.title} openUrl={engine.engineUrl}>
      <EngineFrame src={src} engineOrigin={engineOrigin} title={engine.title} />
    </EngineChrome>
  );
}
