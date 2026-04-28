interface Person {
  name: string;
  role: string;
  affiliation?: string;
  bio: string;
}

const FOUNDER: Person = {
  name: "Thomas K Vaidhyan",
  role: "Founder & CEO",
  bio: "Architect of the AIWIZN multi-agentic learning platform. Brings deep expertise in AI systems design, evidence-based learning science, and healthcare technology. Leads platform strategy, product vision, and investor relations across the 14-month build roadmap.",
};

const ADVISORS: Person[] = [
  {
    name: "Annie Ninan",
    role: "Executive Director",
    affiliation: "University of Texas",
    bio: "Nursing education leadership, curriculum design, and institutional implementation strategy for large academic health systems.",
  },
  {
    name: "Dr. Graham Snyder",
    role: "Medical Director",
    affiliation: "WakeMed Health & Hospitals",
    bio: "Clinical informatics, patient safety systems, and healthcare quality improvement. Guides SIMULUS physiological fidelity and COGNITA clinical validity.",
  },
  {
    name: "Dr. Erin T. Carey",
    role: "Faculty",
    affiliation: "University of North Carolina",
    bio: "Nursing faculty with expertise in simulation-based education, clinical judgment development, and NCLEX-NGN competency frameworks. Informs PRAXIS and NARRATIVE design.",
  },
  {
    name: "Arvind Kumar, MD",
    role: "AI in Healthcare Expert",
    affiliation: "EisnerAmper LLP",
    bio: "Physician and AI in Healthcare strategist bridging clinical practice and emerging technology.",
  },
];

export function Team() {
  return (
    <section className="bg-cream">
      <div className="container py-20 md:py-28">
        <p className="label">Team & Advisors</p>
        <h2 className="mt-4 max-w-4xl font-display text-3xl leading-tight text-ink md:text-5xl">
          Credentialed expertise across clinical, academic & financial domains.
        </h2>

        <div className="mt-14 grid gap-12 lg:grid-cols-3">
          <Card person={FOUNDER} featured />
          <div className="grid gap-5 lg:col-span-2 md:grid-cols-2">
            {ADVISORS.map((p) => (
              <Card key={p.name} person={p} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Card({ person, featured = false }: { person: Person; featured?: boolean }) {
  return (
    <article
      className={`card p-7 ${featured ? "border-teal/30 bg-white/90 shadow-md" : ""}`}
    >
      <p className="font-mono text-[10px] uppercase tracking-label text-ink-3">
        {person.role}
        {person.affiliation && (
          <>
            <span className="mx-2 text-ink-3/50">·</span>
            <span className="text-ink-2">{person.affiliation}</span>
          </>
        )}
      </p>
      <h3 className="mt-3 font-display text-2xl text-ink">{person.name}</h3>
      <p className="mt-3 text-sm leading-relaxed text-ink-2">{person.bio}</p>
    </article>
  );
}
