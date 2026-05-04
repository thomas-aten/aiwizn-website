import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { hasActiveEnginesSubscription } from "@/lib/entitlement";

export const metadata: Metadata = {
  title: "Engines",
  robots: { index: false, follow: false },
};

const ENGINES = [
  {
    id: "clinical",
    title: "Clinical Engine",
    blurb: "PRAXIS · NARRATIVE · SIMULUS · COGNITA · RESONANCE working in concert.",
    href: "/dashboard/engines/clinical",
  },
  {
    id: "jc2026",
    title: "JC 2026 Engine",
    blurb: "Joint Commission 2026 readiness — train and assess against the new standards.",
    href: "/dashboard/engines/jc2026",
  },
];

export default async function EnginesHubPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }> | { checkout?: string };
}) {
  const entitled = await hasActiveEnginesSubscription();
  if (!entitled) redirect("/pricing?reason=subscribe");

  // Allow {checkout: "success"} after Stripe redirect.
  const params = await Promise.resolve(searchParams);
  const justSubscribed = params?.checkout === "success";

  return (
    <>
      <p className="label">Workspace · Engines</p>
      <h1 className="mt-2 font-display text-4xl text-ink md:text-5xl">
        Choose an engine.
      </h1>
      <p className="mt-3 max-w-prose text-ink-2">
        Both engines are unlocked by your active subscription.
      </p>

      {justSubscribed && (
        <p className="mt-6 rounded-lg border border-teal/30 bg-teal-dim px-4 py-3 font-mono text-xs uppercase tracking-label text-teal-dark">
          ● Subscription active — welcome aboard
        </p>
      )}

      <div className="mt-10 grid gap-5 md:grid-cols-2">
        {ENGINES.map((e) => (
          <Link
            key={e.id}
            href={e.href}
            className="card group block overflow-hidden border-teal/20 p-8 transition hover:border-teal/60 hover:shadow-md"
          >
            <p className="font-mono text-[10px] uppercase tracking-label text-teal-dark">
              ● Live · Members only
            </p>
            <h2 className="mt-3 font-display text-2xl text-ink md:text-3xl">
              {e.title}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-ink-2">{e.blurb}</p>
            <p className="mt-6 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-label text-ink-2 transition group-hover:text-teal-dark">
              Launch engine →
            </p>
          </Link>
        ))}
      </div>
    </>
  );
}
