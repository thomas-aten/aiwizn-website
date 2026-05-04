import Link from "next/link";
import { Wordmark } from "@/components/wordmark";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-ink/10 bg-cream-light/50">
      <div className="container py-14">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <Wordmark showTagline />
            <p className="mt-5 max-w-prose text-sm leading-relaxed text-ink-2">
              AIWIZN is an AI-driven nursing education and competency mastery
              platform — replacing outdated onboarding with immersive,
              scenario-driven learning across a nurse&apos;s entire career
              lifecycle.
            </p>
            <p className="mt-6 font-mono text-[11px] uppercase tracking-label text-ink-3">
              Imagination Unlimited
            </p>
          </div>

          <FooterCol title="Platform">
            <FooterLink href="/platform">The flywheel</FooterLink>
            <FooterLink href="/platform#agents">The 10 agents</FooterLink>
            <FooterLink href="/for-hospitals">For hospitals</FooterLink>
            <FooterLink href="/for-schools">For schools</FooterLink>
            <FooterLink href="/pricing">Pricing</FooterLink>
          </FooterCol>

          <FooterCol title="Company">
            <FooterLink href="/about">About</FooterLink>
            <FooterLink href="/contact">Contact</FooterLink>
            <FooterLink href="/login">Sign in</FooterLink>
          </FooterCol>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-ink/10 pt-6 text-xs text-ink-3 md:flex-row md:items-center">
          <p className="font-mono uppercase tracking-label">
            © {new Date().getFullYear()} AIWIZN / Aten Inc.
          </p>
          <p className="font-mono">
            <a className="hover:text-ink" href="mailto:Thomas@ateninc.com">
              Thomas@ateninc.com
            </a>
            <span className="mx-2 text-ink-3/60">·</span>
            <a className="hover:text-ink" href="tel:+19193418234">
              +1 (919) 341-8234
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="font-mono text-[11px] uppercase tracking-label text-ink-3">{title}</h4>
      <ul className="mt-4 space-y-2">{children}</ul>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link
        href={href}
        className="text-sm text-ink-2 transition hover:text-ink"
      >
        {children}
      </Link>
    </li>
  );
}
