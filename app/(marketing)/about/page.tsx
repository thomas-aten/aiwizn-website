import type { Metadata } from "next";
import { CTA } from "@/components/sections/cta";
import { Team } from "@/components/sections/team";

export const metadata: Metadata = {
  title: "About",
  description:
    "AIWIZN is built by Aten Inc. — pairing AI systems design, learning science, and frontline clinical insight to address the nursing workforce crisis.",
};

export default function AboutPage() {
  return (
    <>
      <section>
        <div className="container pt-20 pb-8 md:pt-28">
          <p className="label">About</p>
          <h1 className="mt-4 max-w-4xl font-display text-4xl leading-[1.05] text-ink md:text-6xl">
            Built for patient, mission-aligned capital — and the nurses it serves.
          </h1>
          <p className="mt-6 max-w-prose text-lg leading-relaxed text-ink-2">
            AIWIZN is an AI-driven nursing education and competency mastery
            platform from Aten Inc. We pair multi-agentic AI systems with
            evidence-based learning science and clinical advisory rigour to
            attack the nursing workforce crisis — not as a supply problem, but
            as the retention and competency development problem it actually is.
          </p>
          <p className="mt-6 max-w-prose text-lg leading-relaxed text-ink-2">
            Every design decision is evidence-anchored. Every advisor on this
            page is credentialed in the discipline they advise on. Every claim
            we make is sourced.
          </p>
        </div>
      </section>
      <Team />
      <CTA />
    </>
  );
}
