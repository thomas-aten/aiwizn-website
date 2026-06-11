import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCustomerContext } from "@/lib/customerContext";
import { isPlatformAdmin } from "@/lib/platformAdmin";
import { ENGINE_REGISTRY } from "@/lib/engineRegistry";
import {
  EngineAccessList,
  type EngineAccessRow,
} from "../../_components/EngineAccessList";

export const metadata: Metadata = {
  title: "Admin · Engine access",
  robots: { index: false, follow: false },
};

type Params = { customerId: string };

async function loadCustomer(id: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("customers")
    .select("id, slug, name")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return data;
}

async function loadEngineAccess(customerId: string): Promise<EngineAccessRow[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("customer_engine_access")
    .select("engine_slug, enabled, license_tier, seats")
    .eq("customer_id", customerId);

  if (error) {
    console.warn("[admin/customers/engines] load failed:", error.message);
  }

  const existing = new Map<string, { enabled: boolean; tier: string; seats: number | null }>();
  for (const r of data ?? []) {
    existing.set(r.engine_slug as string, {
      enabled: Boolean(r.enabled),
      tier: (r.license_tier as string) ?? "pilot",
      seats: typeof r.seats === "number" ? r.seats : null,
    });
  }

  // Always render one row per registered engine so a platform admin can flip a
  // not-yet-licensed engine on without separately seeding the row.
  return Object.values(ENGINE_REGISTRY).map((e) => {
    const cur = existing.get(e.slug);
    return {
      slug: e.slug,
      title: e.title,
      enabled: cur?.enabled ?? false,
      licenseTier: cur?.tier ?? "pilot",
      seats: cur?.seats ?? null,
    };
  });
}

export default async function CustomerEnginesPage({
  params,
}: {
  params: Params;
}) {
  const ctx = await getCustomerContext();
  if (ctx.status !== "ok") return null;
  const gate = await isPlatformAdmin(ctx.userId);
  if (!gate.allowed) return notFound();

  const customer = await loadCustomer(params.customerId);
  if (!customer) return notFound();

  const rows = await loadEngineAccess(params.customerId);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label">Platform admin · Engine access</p>
          <h1 className="mt-2 font-display text-3xl text-ink md:text-4xl">
            {customer.name} · engines
          </h1>
          <p className="mt-2 max-w-prose text-sm text-ink-2">
            Toggle which engines this workspace can reach, set the license tier,
            and cap seats. Disabling an engine takes effect on the next page
            load — existing sessions are not torn down.
          </p>
        </div>
        <Link
          href={`/dashboard/admin/customers/${customer.id}`}
          className="btn-ghost text-ink-3 hover:text-ink"
        >
          ← Customer
        </Link>
      </div>

      <div className="mt-8">
        <EngineAccessList customerId={customer.id as string} rows={rows} />
      </div>
    </div>
  );
}
