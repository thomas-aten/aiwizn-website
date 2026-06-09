import Link from "next/link";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { Wordmark } from "@/components/wordmark";
import { createClient } from "@/lib/supabase/server";
import { getCustomerContext } from "@/lib/customerContext";
import { countPendingProposals } from "@/lib/clinicalOverrideProposals";

type NavItem = { href: string; label: string; badge?: number };

const NAV: NavItem[] = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/engines", label: "Engines" },
  { href: "/dashboard/scenarios", label: "Scenarios" },
  { href: "/dashboard/competency", label: "Competency" },
  { href: "/dashboard/team", label: "Team" },
  { href: "/dashboard/settings", label: "Settings" },
];

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Admin nav entry is visible only to customer admins. getCustomerContext is
  // defensive: a missing customer_users table just yields a non-admin context.
  const ctx = await getCustomerContext();
  let nav: NavItem[] = NAV;
  if (ctx.status === "ok" && ctx.role === "admin") {
    const pending = await countPendingProposals(ctx.customerId);
    nav = [
      ...NAV,
      { href: "/dashboard/admin/config", label: "Admin" },
      { href: "/dashboard/admin/reviews", label: "Reviews", badge: pending },
    ];
  }

  const fullName =
    (user.user_metadata?.full_name as string | undefined) ?? user.email ?? "";

  return (
    <div className="min-h-[calc(100vh-3px)]">
      <header className="border-b border-ink/10 bg-cream-light/70 backdrop-blur">
        <div className="container flex h-16 items-center justify-between gap-6">
          <Wordmark showTagline={false} />
          <nav className="hidden items-center gap-6 md:flex" aria-label="Workspace">
            {nav.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-label text-ink-2 hover:text-ink"
              >
                {n.label}
                {typeof n.badge === "number" && n.badge > 0 && (
                  <span
                    className="inline-flex min-w-[1.1rem] items-center justify-center rounded-full bg-orange px-1 py-0.5 text-[9px] font-semibold leading-none text-white"
                    aria-label={`${n.badge} pending`}
                  >
                    {n.badge}
                  </span>
                )}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <span className="hidden font-mono text-[11px] uppercase tracking-label text-ink-3 sm:inline">
              {fullName}
            </span>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="container py-12">{children}</main>
    </div>
  );
}
