import Link from "next/link";
import { Wordmark } from "@/components/wordmark";

const NAV = [
  { href: "/platform", label: "Platform" },
  { href: "/for-hospitals", label: "For Hospitals" },
  { href: "/for-schools", label: "For Schools" },
  { href: "/about", label: "About" },
  { href: "/investors", label: "Investors" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-ink/5 bg-cream-light/70 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between gap-6">
        <Wordmark showTagline={false} />
        <nav className="hidden items-center gap-7 md:flex" aria-label="Primary">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="font-mono text-[11px] uppercase tracking-label text-ink-2 transition hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/login" className="btn-ghost hidden sm:inline-flex">
            Sign in
          </Link>
          <Link href="/signup" className="btn-primary">
            Get access
          </Link>
        </div>
      </div>
    </header>
  );
}
