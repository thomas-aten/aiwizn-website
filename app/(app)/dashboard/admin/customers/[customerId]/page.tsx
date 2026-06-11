import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCustomerContext } from "@/lib/customerContext";
import { isPlatformAdmin } from "@/lib/platformAdmin";
import { CustomerForm } from "../_components/CustomerForm";

export const metadata: Metadata = {
  title: "Admin · Edit customer",
  robots: { index: false, follow: false },
};

type Params = { customerId: string };

async function loadCustomer(id: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("customers")
    .select("id, slug, name, branding, created_at")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return data;
}

export default async function EditCustomerPage({
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

  const branding =
    (customer.branding as { accent_color?: string; logo_url?: string } | null) ??
    {};

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label">Platform admin · Customer</p>
          <h1 className="mt-2 font-display text-3xl text-ink md:text-4xl">
            {customer.name}
          </h1>
          <p className="mt-1 font-mono text-xs text-ink-3">
            slug · {String(customer.slug)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/dashboard/admin/customers/${customer.id}/users`}
            className="btn-ghost text-ink-3 hover:text-ink"
          >
            Members
          </Link>
          <Link
            href={`/dashboard/admin/customers/${customer.id}/engines`}
            className="btn-ghost text-ink-3 hover:text-ink"
          >
            Engines
          </Link>
          <Link
            href="/dashboard/admin/customers"
            className="btn-ghost text-ink-3 hover:text-ink"
          >
            ← All
          </Link>
        </div>
      </div>

      <div className="mt-8">
        <CustomerForm
          mode="edit"
          customerId={customer.id as string}
          initial={{
            name: (customer.name as string) ?? "",
            slug: (customer.slug as string) ?? "",
            accentColor: branding.accent_color ?? "#00A87A",
            logoUrl: branding.logo_url ?? "",
          }}
        />
      </div>
    </div>
  );
}
