import { Wordmark } from "@/components/wordmark";
import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-[calc(100vh-3px)]">
      <div className="container flex min-h-[calc(100vh-3px)] flex-col">
        <div className="flex h-16 items-center justify-between">
          <Wordmark showTagline={false} />
          <Link
            href="/"
            className="font-mono text-[11px] uppercase tracking-label text-ink-3 hover:text-ink"
          >
            ← Back to site
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-md">{children}</div>
        </div>
        <p className="py-6 text-center font-mono text-[10px] uppercase tracking-label text-ink-3">
          Imagination Unlimited · © {new Date().getFullYear()} AIWIZN / Aten Inc.
        </p>
      </div>
    </main>
  );
}
