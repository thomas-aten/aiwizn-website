import { AgentsGrid } from "@/components/sections/agents";
import { CTA } from "@/components/sections/cta";
import { Flywheel } from "@/components/sections/flywheel";
import { Hero } from "@/components/sections/hero";
import { Problem } from "@/components/sections/problem";
import { Team } from "@/components/sections/team";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Problem />
      <Flywheel />
      <AgentsGrid />
      <Team />
      <CTA />
    </>
  );
}
