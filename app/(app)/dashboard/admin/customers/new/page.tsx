import type { Metadata } from "next";
import Link from "next/link";
import { getCustomerContext } from "@/lib/customerContext";
import { isPlatformAdmin } from "@/lib/platformAdmin";
import { CustomerForm } from "../_components/CustomerForm";

export const metadata: Metadata = {
  title: "Admin · New customer",
  robots: { index: false, follow: false },
};

export default async function NewCustomerPage() {
  const ctx = await getCustomerContext();
  if (ctx.status !== "ok") return null;
  const gate = await isPlatformAdmin(ctx.userId);
  if (!gate.allowed) {
    return (
      <div className="mx-auto max-w-md">
        <div className="card border-orange/20 p-8 text-center">
          <p className="font-mono text-[10px] uppercase tracking-label text-orange">
            ● Platform admins only
          </p>
          <p className="mt-3 text-sm leading-relaxed text-ink-2">
            Only AIWIZN platform admins can onboard new customer workspaces.
          </p>
          <Link
            href="/dashboard"
            className="btn-ghost mt-6 text-ink-3 hover:text-ink"
          >
            ← Workspace
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label">Platform admin · Onboarding</p>
          <h1 className="mt-2 font-display text-3xl text-ink md:text-4xl">
            New customer workspace
          </h1>
          <p className="mt-2 max-w-prose text-sm text-ink-2">
            Provisions a customers row, customer_engine_access rows, seeded
            protocol_configs (v1) for each enabled engine, and attaches the
            initial admin. Issues a magic-link invite if the admin email
            isn&rsquo;t a registered user yet.
          </p>
        </div>
        <Link
          href="/dashboard/admin/customers"
          className="btn-ghost text-ink-3 hover:text-ink"
        >
          ← All customers
        </Link>
      </div>

      <div className="mt-8">
        <CustomerForm mode="create" />
      </div>
    </div>
  );
}
