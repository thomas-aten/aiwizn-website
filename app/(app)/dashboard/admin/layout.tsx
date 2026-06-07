import Link from "next/link";
import { redirect } from "next/navigation";
import { getCustomerContext } from "@/lib/customerContext";

/**
 * Admin section gate.
 *
 * Auth + customer-assignment is enforced here; the finer admin-vs-read-only
 * distinction is enforced per-page. Sprint 5 requires non-admin roles
 * (educator / CNO / learner) to still reach the config page in *read-only*
 * mode (step 6), so this layout deliberately does NOT hard-403 non-admins —
 * it blocks only the two cases that have no business in the admin area at all:
 *
 *   • anonymous      → redirect to login (middleware also covers this)
 *   • no customer    → "Access denied" (not attached to any workspace)
 *
 * An assigned non-admin passes through and the page renders read-only.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await getCustomerContext();

  if (ctx.status === "anonymous") {
    redirect("/login?next=/dashboard/admin/config");
  }

  if (ctx.status === "unassigned") {
    return (
      <div className="mx-auto max-w-md">
        <div className="card border-orange/20 p-8 text-center">
          <p className="font-mono text-[10px] uppercase tracking-label text-orange">
            ● Access denied
          </p>
          <h1 className="mt-3 font-display text-2xl text-ink">
            You don&rsquo;t have access to admin
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-ink-2">
            Your account isn&rsquo;t attached to a customer workspace, so there
            is no configuration to administer. Ask your AIWIZN administrator to
            add you, or contact us to get set up.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Link href="/contact" className="btn-primary">
              Contact AIWIZN
            </Link>
            <Link
              href="/dashboard"
              className="btn-ghost text-ink-3 hover:text-ink"
            >
              ← Workspace
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
