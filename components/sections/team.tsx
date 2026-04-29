"use client";

import { useState } from "react";

interface Person {
  name: string;
  credentials?: string;
  role: string;
  affiliation?: string;
  bio: string;
  linkedin?: string;
  image?: string;
  accent?: "teal" | "gold" | "orange" | "purple";
}

const FOUNDER: Person = {
  name: "Thomas K Vaidhyan",
  role: "Founder & CEO · AIWIZN / Aten Inc.",
  bio: "Architect of the AIWIZN multi-agentic learning platform and founder of Aten Inc. Serial ed-tech entrepreneur across immersive learning, serious games, and AI-driven training simulations, with research partnerships at NC State, Virginia Tech, and Duke. Founding board member of BEST NC and Research Triangle High School. Leads platform strategy, product vision, and investor relations across the 14-month build roadmap.",
  linkedin: "https://www.linkedin.com/in/thomasvaidhyan",
  image: "/images/team/thomas.jpg",
  accent: "teal",
};

const ADVISORS: Person[] = [
  {
    name: "Annie Baby",
    credentials: "MA, MBA, MSN, FNP-BC",
    role: "Deputy Executive Director, Tennessee Population Health Consortium",
    affiliation:
      "University of Tennessee School of Health Sciences — School of Medicine",
    bio: "Valid active RN and Advanced Nurse Practitioner licensure. Experienced clinical, operational, and business leader across health-system organisations. Pairs frontline nursing practice with health-economics, analytics, and value-based-care strategy — informing how AIWIZN translates nursing-education frameworks into scalable clinical learning architectures.",
    linkedin:
      "https://www.linkedin.com/in/annie-ninan-ma-economics-mba-msn-fnp-bc",
    image: "/images/team/annie.jpg",
    accent: "teal",
  },
  {
    name: "Dr. Graham Snyder",
    credentials: "MD, FACEP",
    role: "Medical Director, WakeMed Center for Innovative Learning",
    affiliation:
      "WakeMed · Associate Program Director, UNC Emergency Medicine",
    bio: "Longest-serving clinical champion of simulation-based training at WakeMed. Co-developed AIWIZN's clinical validation framework. Engineer-turned-emergency-physician who runs WakeMed's Center for Innovative Learning — a high-fidelity training facility serving thousands of clinicians annually. Guides SIMULUS physiological fidelity and COGNITA clinical validity.",
    linkedin: "https://www.linkedin.com/in/grahamesnyder",
    image: "/images/team/graham.jpg",
    accent: "orange",
  },
  {
    name: "Arvind Kumar",
    role: "Managing Director · Head of Digital Health",
    affiliation: "EisnerAmper LLC",
    bio: "Healthcare-technology strategist with 25+ years across executive and advisory roles — former CIO at Cincinnati Children's, SVP at Xerox Healthcare, and digital-risk leadership at a Big 4 firm. Adjunct faculty at Harvard School of Public Health, Northeastern, and Suffolk. Advises AIWIZN on responsible AI deployment, clinical validation, and healthcare-technology risk.",
    linkedin: "https://www.linkedin.com/in/arvindpkumar",
    image: "/images/team/arvind.jpg",
    accent: "gold",
  },
  {
    name: "Dr. Erin T. Carey",
    credentials: "MD, MSCR",
    role: "Surgeon · Division Chief, Minimally Invasive Gynecologic Surgery · Co-Executive Director, FastTraCS",
    affiliation: "University of North Carolina",
    bio: "UNC surgeon-innovator leading the Division of Minimally Invasive Gynecologic Surgery and co-leading FastTraCS, UNC's clinical-innovation accelerator. Pairs procedural rigour with translational research and device design — informing AIWIZN's PRAXIS and NARRATIVE work on procedural fidelity, clinical-judgement formation, and innovation pathways from bedside insight to validated practice.",
    linkedin: "https://www.linkedin.com/in/erin-c-66b4b7a7",
    image: "/images/team/erin.jpg",
    accent: "purple",
  },
];

export function Team() {
  return (
    <section className="bg-cream">
      <div className="container py-20 md:py-28">
        <p className="label">Leadership & Advisors</p>
        <h2 className="mt-4 max-w-4xl font-display text-3xl leading-tight text-ink md:text-5xl">
          Building the future of workforce intelligence.
        </h2>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ink-2">
          Credentialed expertise across clinical, academic, and financial
          domains.
        </p>

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
      <div className="flex items-start gap-4">
        <Avatar person={person} size={featured ? 72 : 56} />
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[10px] uppercase leading-tight tracking-label text-ink-3">
            {person.role}
            {person.affiliation && (
              <>
                <span className="mx-2 text-ink-3/50">·</span>
                <span className="text-ink-2">{person.affiliation}</span>
              </>
            )}
          </p>
          <h3 className="mt-2 font-display text-2xl leading-tight text-ink">
            {person.name}
            {person.credentials && (
              <span className="ml-2 font-mono text-xs uppercase tracking-label text-ink-3">
                · {person.credentials}
              </span>
            )}
          </h3>
        </div>
      </div>
      <p className="mt-4 text-sm leading-relaxed text-ink-2">{person.bio}</p>
      {person.linkedin && (
        <a
          href={person.linkedin}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-label text-ink-3 transition hover:text-teal-dark"
        >
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" aria-hidden fill="currentColor">
            <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.35V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45C23.21 24 24 23.23 24 22.28V1.72C24 .77 23.21 0 22.22 0z" />
          </svg>
          LinkedIn
        </a>
      )}
    </article>
  );
}

const ACCENT_BG: Record<NonNullable<Person["accent"]>, string> = {
  teal: "from-teal/30 to-teal/10 text-teal-dark",
  gold: "from-gold/30 to-gold/10 text-gold",
  orange: "from-orange/30 to-orange/10 text-orange",
  purple: "from-purple/30 to-purple/10 text-purple",
};

function Avatar({ person, size = 56 }: { person: Person; size?: number }) {
  const [errored, setErrored] = useState(false);
  const initials = getInitials(person.name);
  const accent = person.accent ?? "teal";
  const showImage = person.image && !errored;

  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full ring-1 ring-ink/10 ${
        showImage ? "bg-ink/5" : `bg-gradient-to-br ${ACCENT_BG[accent]}`
      }`}
      style={{ width: size, height: size }}
      aria-hidden
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={person.image}
          alt=""
          className="h-full w-full object-cover"
          onError={() => setErrored(true)}
        />
      ) : (
        <span
          className="font-display font-semibold tracking-tight"
          style={{ fontSize: size * 0.42 }}
        >
          {initials}
        </span>
      )}
    </span>
  );
}

function getInitials(name: string) {
  const words = name
    .replace(/^(dr\.?|mr\.?|mrs\.?|ms\.?|prof\.?)\s+/i, "")
    .replace(/,.*$/, "")
    .trim()
    .split(/\s+/);
  const first = words[0]?.[0] ?? "";
  const last = words[words.length - 1]?.[0] ?? "";
  return (first + last).toUpperCase();
}
