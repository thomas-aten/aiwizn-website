import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { hasActiveEnginesSubscription } from "@/lib/entitlement";

export const metadata: Metadata = {
  title: "Clinical Engine",
  robots: { index: false, follow: false },
};

const ENGINE_URL = "https://thomas-aten.github.io/aiwizn-clinical-engine/";

export default async function ClinicalEnginePage() {
  const entitled = await hasActiveEnginesSubscription();
  if (!entitled) redirect("/pricing?reason=subscribe");

  return (
    <div className="-mx-5 -my-12 md:-mx-8 lg:-mx-12">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/10 bg-cream-light/70 px-5 py-3 md:px-8 lg:px-12">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-label text-ink-3">
            Workspace · Engine
          </p>
          <h1 className="mt-0.5 font-display text-xl text-ink">
            AIWIZN Clinical Engine
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <a href={ENGINE_URL} target="_blank" rel="noopener noreferrer" className="btn-secondary">
            Open in new tab ↗
          </a>
          <Link href="/dashboard/engines" className="btn-ghost text-ink-3 hover:text-ink">
            ← Engines
          </Link>
        </div>
      </div>
      <div className="relative h-[calc(100vh-7rem)] w-full bg-ink/5">
        <iframe
          src={ENGINE_URL}
          title="AIWIZN Clinical Engine"
          className="absolute inset-0 h-full w-full border-0"
          loading="lazy"
          allow="autoplay; fullscreen; clipboard-write"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    </div>
  );
}
