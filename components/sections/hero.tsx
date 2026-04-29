import Link from "next/link";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="container relative pt-20 pb-16 md:pt-32 md:pb-24">
        <div className="grid items-start gap-12 lg:grid-cols-[minmax(0,1fr)_420px] lg:gap-16">
          <div>
            <p className="label mb-6">AIWIZN · The Wisdom Engine</p>

            <h1 className="font-display text-4xl leading-[1.05] tracking-tight text-ink md:text-6xl lg:text-7xl">
              The Wisdom of <em className="not-italic text-teal-dark">Expert Nurses</em>,
              <br className="hidden md:block" />
              Captured. Scaled. Deployed.
            </h1>

            <p className="mt-8 max-w-2xl text-lg leading-relaxed text-ink-2 md:text-xl">
              AIWIZN is an AI-driven nursing education and competency mastery
              platform that replaces outdated onboarding with immersive,
              scenario-driven learning — measurably reducing clinical errors,
              turnover, and time-to-competency across a nurse&apos;s entire career
              lifecycle.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-3">
              <Link href="/signup" className="btn-primary">
                Request access
              </Link>
              <Link href="/platform" className="btn-secondary">
                Explore the platform
              </Link>
            </div>
          </div>

          <HeroVisual />
        </div>

        <dl className="mt-16 grid grid-cols-2 gap-8 border-t border-ink/10 pt-10 md:grid-cols-4">
          <Stat value="$52K" label="Avg. cost saved per nurse retained" />
          <Stat value="6–12 mo" label="Time to independent competency, traditional path" />
          <Stat value="28%" label="Knowledge retained at 6 months, single-session training" />
          <Stat value="$917B" label="Projected U.S. workforce shortage cost by 2030" />
        </dl>
      </div>
    </section>
  );
}

function HeroVisual() {
  return (
    <div className="relative hidden lg:block">
      <div className="absolute -inset-3 -z-10 rounded-3xl bg-gradient-to-br from-teal/10 via-transparent to-orange/10 blur-2xl" />
      <figure className="relative overflow-hidden rounded-2xl border border-ink/10 bg-ink/[0.04] shadow-xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/immersive-learning.jpg"
          alt="Immersive scenario-driven learning"
          className="aspect-[3/4] h-full w-full object-cover"
        />
        <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/85 via-ink/40 to-transparent p-5">
          <p className="font-mono text-[10px] uppercase tracking-label text-cream-light/80">
            Immersive · Scenario-driven · Evidence-anchored
          </p>
        </figcaption>
      </figure>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="font-display text-3xl text-ink md:text-4xl">{value}</div>
      <div className="mt-2 max-w-[18ch] font-mono text-[11px] uppercase leading-snug tracking-label text-ink-3">
        {label}
      </div>
    </div>
  );
}
