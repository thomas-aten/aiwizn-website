import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCustomerContext } from "@/lib/customerContext";
import { isPlatformAdmin } from "@/lib/platformAdmin";
import { UserList, type UserRow } from "../../_components/UserList";
import type { CustomerRole } from "../../_actions";

export const metadata: Metadata = {
  title: "Admin · Customer members",
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

async function loadMembers(customerId: string): Promise<UserRow[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("customer_users")
    .select("user_id, role")
    .eq("customer_id", customerId);
  if (error || !data) return [];

  // Resolve emails via the admin auth API in parallel; fall back to a truncated
  // id label if a lookup fails (matches the reviews page pattern).
  const rows = await Promise.all(
    data.map(async (m): Promise<UserRow> => {
      const id = m.user_id as string;
      let email = `${id.slice(0, 8)}…`;
      try {
        const { data: u } = await admin.auth.admin.getUserById(id);
        if (u?.user?.email) email = u.user.email;
      } catch {
        // swallow — id-shorthand fallback is acceptable
      }
      return { userId: id, email, role: m.role as CustomerRole };
    }),
  );
  return rows.sort((a, b) => a.email.localeCompare(b.email));
}

export default async function CustomerUsersPage({
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

  const users = await loadMembers(params.customerId);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label">Platform admin · Members</p>
          <h1 className="mt-2 font-display text-3xl text-ink md:text-4xl">
            {customer.name} · members
          </h1>
          <p className="mt-2 max-w-prose text-sm text-ink-2">
            {users.length} attached. Removing the last admin is blocked —
            promote another member to admin first.
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
        <UserList
          customerId={customer.id as string}
          customerName={customer.name as string}
          users={users}
        />
      </div>
    </div>
  );
}
