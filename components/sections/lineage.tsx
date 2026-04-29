interface LineageItem {
  src: string;
  alt: string;
  caption: string;
  domain: string;
}

const ITEMS: LineageItem[] = [
  {
    src: "/images/dermatology.jpg",
    alt: "Bedside dermatology scenario — situational and application-based assessment",
    caption: "Bedside dermatology scenarios",
    domain: "Clinical · Procedural",
  },
  {
    src: "/images/pilot.jpg",
    alt: "Cockpit-based flight training simulator with adaptive instruction",
    caption: "Cockpit decision training",
    domain: "Aviation · NBME-recognised",
  },
  {
    src: "/images/grifols-vr.jpg",
    alt: "Stereoscopic VR view of a clinical training environment",
    caption: "Pharma manufacturing VR",
    domain: "Industry · Immersive",
  },
  {
    src: "/images/classroom.png",
    alt: "Role-playing classroom decision-making scenario",
    caption: "Role-play decision scenarios",
    domain: "Education · Adaptive",
  },
];

export function Lineage() {
  return (
    <section className="bg-cream-light/40">
      <div className="container py-20 md:py-28">
        <p className="label">Research Foundation</p>
        <h2 className="mt-4 max-w-4xl font-display text-3xl leading-tight text-ink md:text-5xl">
          A decade of immersive simulation work — now turned on nursing.
        </h2>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-2">
          AIWIZN evolves from Aten Inc.&apos;s portfolio of adaptive,
          scenario-driven training systems — recognised by the National Board
          of Medical Examiners, the Gates Foundation, MacArthur, and JP Morgan.
          The same engine that taught pilots, manufacturers, and dermatologists
          now teaches nurses.
        </p>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {ITEMS.map((item) => (
            <figure
              key={item.src}
              className="overflow-hidden rounded-2xl border border-ink/10 bg-white/70 shadow-sm"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-ink/5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.src}
                  alt={item.alt}
                  className="h-full w-full object-cover transition group-hover:scale-105"
                />
              </div>
              <figcaption className="p-5">
                <p className="font-mono text-[10px] uppercase tracking-label text-ink-3">
                  {item.domain}
                </p>
                <p className="mt-2 font-display text-lg text-ink">{item.caption}</p>
              </figcaption>
            </figure>
          ))}
        </div>

        <div className="mt-12 grid items-center gap-8 rounded-2xl border border-ink/10 bg-white/60 p-8 md:grid-cols-[1fr_360px] md:p-10">
          <div>
            <p className="label">Aten methodology</p>
            <h3 className="mt-3 font-display text-2xl leading-tight text-ink md:text-3xl">
              Show. Make-them-do. Track. Feedback. Adaptive intelligence.
            </h3>
            <p className="mt-4 max-w-prose text-base leading-relaxed text-ink-2">
              AIWIZN&apos;s flywheel is the clinical implementation of Aten&apos;s
              proven adaptive learning loop — the same Cerebrum / Cerebellum /
              Arete architecture that powered enterprise simulations for Fortune
              500s, now tuned for clinical judgement.
            </p>
          </div>
          <figure className="overflow-hidden rounded-xl border border-ink/10 bg-cream-light">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/process.jpg"
              alt="Aten adaptive learning methodology cycle"
              className="h-full w-full object-contain"
            />
          </figure>
        </div>
      </div>
    </section>
  );
}
