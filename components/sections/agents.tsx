import { AGENTS, STAGES, type Agent } from "@/lib/agents";

const STAGE_ACCENT: Record<string, string> = {
  teal: "border-teal/30 bg-teal-dim text-teal-dark",
  orange: "border-orange/30 bg-orange-dim text-orange",
  gold: "border-gold/30 bg-gold-dim text-gold",
  purple: "border-purple/30 bg-purple-dim text-purple",
};

export function AgentsGrid() {
  return (
    <section id="agents">
      <div className="container py-20 md:py-28">
        <p className="label">The Platform</p>
        <h2 className="mt-4 max-w-4xl font-display text-3xl leading-tight text-ink md:text-5xl">
          Ten specialised agents. One coherent learning system.
        </h2>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-2">
          Each agent owns a distinct stage of the competency lifecycle —
          policy authoring, narrative generation, simulation, stealth
          assessment, formative coaching, and lifecycle orchestration.
        </p>

        <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {AGENTS.map((agent) => (
            <AgentCard key={agent.id} agent={agent} />
          ))}
        </div>
      </div>
    </section>
  );
}

function AgentCard({ agent }: { agent: Agent }) {
  const stage = STAGES.find((s) => s.id === agent.stage)!;
  return (
    <article className="card p-6">
      <div className="flex items-center justify-between">
        <span
          className={`inline-flex rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-label ${STAGE_ACCENT[stage.accent]}`}
        >
          {stage.title}
        </span>
        <span className="font-mono text-[10px] uppercase tracking-label text-ink-3">
          {agent.role}
        </span>
      </div>
      <h3 className="mt-5 font-display text-2xl text-ink">{agent.name}</h3>
      <p className="mt-2 text-sm leading-relaxed text-ink-2">{agent.description}</p>
    </article>
  );
}
