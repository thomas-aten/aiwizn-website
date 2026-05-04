import Link from "next/link";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { Wordmark } from "@/components/wordmark";
import { createClient } from "@/lib/supabase/server";

const NAV = [
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

  const fullName =
    (user.user_metadata?.full_name as string | undefined) ?? user.email ?? "";

  return (
    <div className="min-h-[calc(100vh-3px)]">
      <header className="border-b border-ink/10 bg-cream-light/70 backdrop-blur">
        <div className="container flex h-16 items-center justify-between gap-6">
          <Wordmark showTagline={false} />
          <nav className="hidden items-center gap-6 md:flex" aria-label="Workspace">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className="font-mono text-[11px] uppercase tracking-label text-ink-2 hover:text-ink"
              >
                {n.label}
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
