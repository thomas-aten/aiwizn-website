import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCustomerContext } from "@/lib/customerContext";
import { migrateToV11, type ProtocolConfigV11 } from "@/lib/protocolConfig";
import { ConfigEditor } from "./_components/ConfigEditor";

export const metadata: Metadata = {
  title: "Admin · Config",
  robots: { index: false, follow: false },
};

/**
 * Load the customer's current published config. Reads the most-recent
 * `protocol_configs` row for the tenant (any engine slug) and coerces it to the
 * complete v1.1 shape via {@link migrateToV11}. When the table/row is absent we
 * seed the editor with the canonical default so a fresh tenant can publish v1.

 * The slug/customer_name come from the `customers` row when available, falling
 * back to a tenant-id-derived placeholder.
 */
async function loadCurrentConfig(
  supabase: ReturnType<typeof createClient>,
  customerId: string,
): Promise<{ config: ProtocolConfigV11; version: number }> {
  // Tenant identity for branding defaults.
  let slug = "your-hospital";
  let name = "Your Hospital";
  const { data: customer } = await supabase
    .from("customers")
    .select("slug, name")
    .eq("id", customerId)
    .maybeSingle();
  if (customer) {
    slug = (customer.slug as string) ?? slug;
    name = (customer.name as string) ?? name;
  }

  const { data: row, error } = await supabase
    .from("protocol_configs")
    .select("config_json, version")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.warn("[admin/config] protocol_configs unavailable:", error.message);
  }

  const config = migrateToV11(row?.config_json, slug, name);
  const version =
    typeof row?.version === "number" && Number.isFinite(row.version)
      ? row.version
      : 0;
  return { config, version };
}

export default async function AdminConfigPage() {
  // The admin layout already gated anonymous/unassigned; resolve again here for
  // role (canEdit) and customer id. Cheap, and keeps the page self-contained.
  const ctx = await getCustomerContext();
  if (ctx.status !== "ok") {
    // Layout normally handles these; render nothing meaningful as a backstop.
    return null;
  }

  const supabase = createClient();
  const { config, version } = await loadCurrentConfig(supabase, ctx.customerId);

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label">Admin · Protocol config</p>
          <h1 className="mt-2 font-display text-3xl text-ink md:text-4xl">
            Configuration editor
          </h1>
          <p className="mt-2 max-w-prose text-sm text-ink-2">
            Edit your organization&rsquo;s protocol configuration. Changes are
            versioned — publishing creates a new version that the engines pick
            up automatically.
          </p>
        </div>
        <div className="text-right">
          <p className="font-mono text-[10px] uppercase tracking-label text-ink-3">
            Current version
          </p>
          <p className="font-display text-2xl text-ink">
            v{version || "—"}
          </p>
          <Link
            href="/dashboard/engines"
            className="btn-ghost mt-1 text-ink-3 hover:text-ink"
          >
            ← Engines
          </Link>
        </div>
      </div>

      <div className="mt-8">
        <ConfigEditor
          initialConfig={config}
          currentVersion={version}
          canEdit={ctx.canEdit}
          role={ctx.role}
        />
      </div>
    </div>
  );
}
