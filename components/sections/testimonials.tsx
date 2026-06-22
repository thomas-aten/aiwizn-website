interface Testimonial {
  quote: string;
  name: string;
  credentials?: string;
  role: string;
  affiliation: string;
  location: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    quote: "This is impressive; it needs serious judgement skills!",
    name: "Dr. Graham E. Snyder",
    credentials: "MD, FACEP",
    role: "Medical Director, Medical Simulation Center",
    affiliation: "WakeMed Health & Hospitals",
    location: "Raleigh, NC",
  },
  {
    quote: "Wow! This is exactly what AI needs to do!",
    name: "Dr. Bimal Kumar Parameswaran",
    role: "Radiologist",
    affiliation: "Capital Radiology",
    location: "Greater Melbourne, Australia",
  },
  {
    quote: "Amazing — I loved this simulation. This is how I would love to learn!",
    name: "Lynn Kenyon",
    credentials: "BSN, RN",
    role: "Immunization Nurse",
    affiliation: "Duke Student Health",
    location: "Durham, NC",
  },
];

export function Testimonials() {
  return (
    <section className="bg-cream-light/60">
      <div className="container py-20 md:py-28">
        <p className="label">Endorsements</p>
        <h2 className="mt-4 max-w-3xl font-display text-3xl leading-tight text-ink md:text-5xl">
          What clinicians say after their first scenario.
        </h2>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-2">
          Unfiltered first impressions from physicians, radiologists, and
          nurses who&apos;ve seen AIWIZN in action.
        </p>

        <ol
          className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3"
          role="list"
        >
          {TESTIMONIALS.map((t) => (
            <Card key={t.name} testimonial={t} />
          ))}
        </ol>
      </div>
    </section>
  );
}

function Card({ testimonial: t }: { testimonial: Testimonial }) {
  return (
    <li className="card relative flex h-full flex-col p-7 md:p-8">
      <span
        aria-hidden
        className="select-none font-display text-7xl leading-none text-teal-dark/40 md:text-8xl"
      >
        &ldquo;
      </span>

      <blockquote className="-mt-6 font-display text-2xl leading-snug text-ink md:text-[1.75rem]">
        {t.quote}
      </blockquote>

      <div className="mt-6 flex items-center gap-3" aria-hidden>
        <span className="h-px w-10 bg-teal-dark/70" />
        <span className="font-mono text-[10px] uppercase tracking-label text-teal-dark">
          {t.affiliation.split(" ")[0]}
        </span>
      </div>

      <footer className="mt-3 not-italic">
        <p className="font-display text-lg leading-tight text-ink">
          {t.name}
          {t.credentials && (
            <span className="ml-2 font-mono text-[10px] uppercase tracking-label text-ink-3">
              · {t.credentials}
            </span>
          )}
        </p>
        <p className="mt-1 font-mono text-[10px] uppercase leading-snug tracking-label text-ink-3">
          {t.role}
          <span className="mx-2 text-ink-3/50">·</span>
          <span className="text-ink-2">{t.affiliation}</span>
        </p>
        <p className="mt-1 font-mono text-[10px] uppercase tracking-label text-ink-3">
          {t.location}
        </p>
      </footer>
    </li>
  );
}
