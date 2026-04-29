interface LineageItem {
  src: string;
  alt: string;
  caption: string;
  domain: string;
}

const ITEMS: LineageItem[] = [
  {
    src: "/images/dermatology.jpg",
    alt: "Bedside clinical scenario — situational and application-based assessment",
    caption: "Bedside clinical scenarios",
    domain: "Clinical · NBME-recognised",
  },
  {
    src: "/images/pilot.jpg",
    alt: "Cockpit-based flight training simulator with adaptive instruction",
    caption: "Cockpit decision training",
    domain: "Aviation · Adaptive",
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

interface Award {
  year: string;
  title: string;
  org: string;
  detail: string;
}

const AWARDS: Award[] = [
  {
    year: "2017",
    title: "Cited as a Key Player",
    org: "World Serious Game Market Forecast 2017–2023",
    detail: "Independent industry analyst recognition for serious-game design.",
  },
  {
    year: "2015",
    title: "Centennial Competition · Semi-Finalist",
    org: "National Board of Medical Examiners (NBME)",
    detail: "Selected from a global field for clinical-assessment innovation.",
  },
  {
    year: "2012",
    title: "Innovation Award",
    org: "JP Morgan Chase · Jamie Dimon",
    detail: "Recognised by the CEO for excellence in enterprise innovation.",
  },
  {
    year: "2011",
    title: "Next Generation Learning Challenge · Finalist",
    org: "Bill & Melinda Gates Foundation",
    detail: "Awarded for adaptive, data-driven learning methodology.",
  },
  {
    year: "2010",
    title: "Digital Media & Learning Competition · Finalist",
    org: "MacArthur Foundation",
    detail: "Recognised for evidence-anchored learning design.",
  },
];

export function Lineage() {
  return (
    <section className="bg-cream-light/40">
      <div className="container py-20 md:py-28">
        <p className="label">Research Foundation · 21 Years</p>
        <h2 className="mt-4 max-w-4xl font-display text-3xl leading-tight text-ink md:text-5xl">
          Twenty-one years of immersive simulation work — now turned on nursing.
        </h2>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-2">
          AIWIZN evolves from Aten Inc.&apos;s 21-year portfolio of adaptive,
          scenario-driven training systems — anchored in research-proven
          pedagogy and serious-game best practices. The same engine that taught
          pilots, manufacturers, and clinicians now teaches nurses.
        </p>

        {/* Portfolio thumbnails */}
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

        {/* Awards strip */}
        <div className="mt-16">
          <p className="label">Recognition</p>
          <h3 className="mt-3 max-w-3xl font-display text-2xl leading-tight text-ink md:text-3xl">
            Awarded by the institutions that set the bar.
          </h3>
          <ol className="mt-8 grid gap-px overflow-hidden rounded-2xl border border-ink/10 bg-ink/10 md:grid-cols-2 lg:grid-cols-5">
            {AWARDS.map((a) => (
              <li
                key={`${a.year}-${a.org}`}
                className="bg-cream-light p-6"
              >
                <div className="font-mono text-[10px] uppercase tracking-label text-ink-3">
                  {a.year}
                </div>
                <div className="mt-2 font-display text-lg leading-snug text-ink">
                  {a.title}
                </div>
                <div className="mt-1 font-mono text-[10px] uppercase tracking-label text-teal-dark">
                  {a.org}
                </div>
                <p className="mt-3 text-xs leading-snug text-ink-2">{a.detail}</p>
              </li>
            ))}
          </ol>
        </div>

        {/* Methodology */}
        <div className="mt-16 grid items-center gap-8 rounded-2xl border border-ink/10 bg-white/60 p-8 md:grid-cols-[1fr_360px] md:p-10">
          <div>
            <p className="label">Aten methodology</p>
            <h3 className="mt-3 font-display text-2xl leading-tight text-ink md:text-3xl">
              Show. Make-them-do. Track. Feedback. Adaptive intelligence.
            </h3>
            <p className="mt-4 max-w-prose text-base leading-relaxed text-ink-2">
              AIWIZN&apos;s flywheel is the clinical implementation of Aten&apos;s
              research-proven adaptive learning loop — the same Cerebrum /
              Cerebellum / Arete architecture that powered enterprise simulations
              for Fortune 500s and earned a JP Morgan Chase innovation award
              under Jamie Dimon. Built on serious-game best practices, validated
              by NBME, MacArthur, and Gates.
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
