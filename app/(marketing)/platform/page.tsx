import type { Metadata } from "next";
import { AgentsGrid } from "@/components/sections/agents";
import { Flywheel } from "@/components/sections/flywheel";

export const metadata: Metadata = {
  title: "Platform",
  description:
    "The AIWIZN platform — ten specialised agents organised across a four-stage virtuous learning flywheel.",
};

export default function PlatformPage() {
  return (
    <>
      <section>
        <div className="container pt-20 pb-8 md:pt-28">
          <p className="label">The Platform</p>
          <h1 className="mt-4 max-w-4xl font-display text-4xl leading-[1.05] text-ink md:text-6xl">
            Built for the rigour the profession demands.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-2">
            Every design decision is evidence-anchored. AIWIZN combines
            simulation, stealth psychometrics, and adaptive coaching into one
            coherent system that gets smarter with every nurse it trains.
          </p>
        </div>
      </section>
      <Flywheel />
      <AgentsGrid />
    </>
  );
}
