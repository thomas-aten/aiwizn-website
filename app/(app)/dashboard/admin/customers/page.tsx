import type { Metadata } from "next";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCustomerContext } from "@/lib/customerContext";
import { isPlatformAdmin } from "@/lib/platformAdmin";

export const metadata: Metadata = {
  title: "Admin · Customers",
  robots: { index: false, follow: false },
};

type CustomerRow = {
  id: string;
  slug: string;
  name: string;
  branding: { accent_color?: string; logo_url?: string } | null;
  created_at: string;
  member_count: number;
  engine_count: number;
};

async function loadCustomers(): Promise<CustomerRow[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("customers")
    .select("id, slug, name, branding, created_at")
    .order("created_at", { ascending: true });
  if (error || !data) {
    console.warn("[admin/customers] load failed:", error?.message);
    return [];
  }

  // Counts: two cheap secondary queries rather than a join, keeps RLS-free path
  // simple. For seed-scale (<50 customers) the overhead is negligible.
  const ids = data.map((c) => c.id as string);
  const counts: Record<string, { members: number; engines: number }> = {};
  for (const id of ids) counts[id] = { members: 0, engines: 0 };

  if (ids.length > 0) {
    const { data: members } = await admin
      .from("customer_users")
      .select("customer_id")
      .in("customer_id", ids);
    for (const m of members ?? []) {
      const k = m.customer_id as string;
      if (counts[k]) counts[k].members += 1;
    }
    const { data: engines } = await admin
      .from("customer_engine_access")
      .select("customer_id, enabled")
      .in("customer_id", ids);
    for (const e of engines ?? []) {
      const k = e.customer_id as string;
      if (counts[k] && e.enabled) counts[k].engines += 1;
    }
  }

  return data.map((c) => ({
    id: c.id as string,
    slug: c.slug as string,
    name: c.name as string,
    branding: (c.branding as CustomerRow["branding"]) ?? null,
    created_at: c.created_at as string,
    member_count: counts[c.id as string]?.members ?? 0,
    engine_count: counts[c.id as string]?.engines ?? 0,
  }));
}

export default async function CustomersListPage() {
  const ctx = await getCustomerContext();
  if (ctx.status !== "ok") {
    return null; // admin layout handles redirect
  }
  const gate = await isPlatformAdmin(ctx.userId);
  if (!gate.allowed) {
    return <PlatformAdminGate matched={gate.matched} total={gate.totalSeed} />;
  }

  const rows = await loadCustomers();

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label">Platform admin · Customers</p>
          <h1 className="mt-2 font-display text-3xl text-ink md:text-4xl">
            Customer workspaces
          </h1>
          <p className="mt-2 max-w-prose text-sm text-ink-2">
            Onboard a new hospital, edit branding, manage members, or toggle
            engine access. Every change here writes an audit-log event.
          </p>
        </div>
        <Link href="/dashboard/admin/customers/new" className="btn-primary">
          + New customer
        </Link>
      </div>

      <div className="mt-8 overflow-hidden rounded-xl border border-ink/10 bg-cream-light">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-ink/10 bg-ink/[0.02] text-left">
              <Th>Customer</Th>
              <Th>Slug</Th>
              <Th>Members</Th>
              <Th>Engines</Th>
              <Th>Created</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-10 text-center text-sm text-ink-3"
                >
                  No customers yet. Create the first one →
                </td>
              </tr>
            )}
            {rows.map((c) => (
              <tr key={c.id} className="border-b border-ink/5 last:border-0">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span
                      aria-hidden
                      className="inline-block h-3 w-3 rounded-full border border-ink/10"
                      style={{
                        backgroundColor:
                          c.branding?.accent_color ?? "#00A87A",
                      }}
                    />
                    <span className="font-display text-ink">{c.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <code className="font-mono text-xs text-ink-2">{c.slug}</code>
                </td>
                <td className="px-4 py-3 text-ink-2">{c.member_count}</td>
                <td className="px-4 py-3 text-ink-2">{c.engine_count}</td>
                <td className="px-4 py-3 font-mono text-[11px] text-ink-3">
                  {new Date(c.created_at).toISOString().slice(0, 10)}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/dashboard/admin/customers/${c.id}`}
                    className="font-mono text-[11px] uppercase tracking-label text-teal hover:underline"
                  >
                    Edit
                  </Link>
                  <span className="mx-2 text-ink-3">·</span>
                  <Link
                    href={`/dashboard/admin/customers/${c.id}/users`}
                    className="font-mono text-[11px] uppercase tracking-label text-teal hover:underline"
                  >
                    Members
                  </Link>
                  <span className="mx-2 text-ink-3">·</span>
                  <Link
                    href={`/dashboard/admin/customers/${c.id}/engines`}
                    className="font-mono text-[11px] uppercase tracking-label text-teal hover:underline"
                  >
                    Engines
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={`px-4 py-2 font-mono text-[10px] uppercase tracking-label text-ink-3 ${
        className ?? ""
      }`}
    >
      {children}
    </th>
  );
}

function PlatformAdminGate({
  matched,
  total,
}: {
  matched: number;
  total: number;
}) {
  return (
    <div className="mx-auto max-w-md">
      <div className="card border-orange/20 p-8 text-center">
        <p className="font-mono text-[10px] uppercase tracking-label text-orange">
          ● Platform admins only
        </p>
        <h1 className="mt-3 font-display text-2xl text-ink">
          You don&rsquo;t have access here
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-2">
          The customer-onboarding surface is restricted to AIWIZN platform
          admins. Your account is admin of {matched} of {total} seed workspaces.
        </p>
        <div className="mt-6">
          <Link href="/dashboard" className="btn-ghost text-ink-3 hover:text-ink">
            ← Workspace
          </Link>
        </div>
      </div>
    </div>
  );
}
