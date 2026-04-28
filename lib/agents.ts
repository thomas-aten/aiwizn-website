// The 10 specialized AIWIZN agents — sourced verbatim from the investor brief.
// Order matches the four-stage Virtuous Learning Flywheel: Learn → Practice → Assess → Relearn.

export type AgentStage = "learn" | "practice" | "assess" | "relearn";

export interface Agent {
  id: string;
  name: string;
  role: string;
  stage: AgentStage;
  description: string;
}

export const AGENTS: Agent[] = [
  {
    id: "praxis",
    name: "PRAXIS",
    role: "SOP → Competency",
    stage: "learn",
    description:
      "Transforms clinical policies and standard operating procedures into structured competency maps that downstream agents can build against.",
  },
  {
    id: "narrative",
    name: "NARRATIVE",
    role: "Storyboard Generation",
    stage: "learn",
    description:
      "Generates rich, evidence-grounded scenario introductions — narrative-first, not a slide deck.",
  },
  {
    id: "visio",
    name: "VISIO",
    role: "Procedural Animation",
    stage: "learn",
    description:
      "Renders animated clinical procedures and patient states so learners see — not just read — the situation they are walking into.",
  },
  {
    id: "simulus",
    name: "SIMULUS",
    role: "Clinical Simulation",
    stage: "practice",
    description:
      "Dynamic patient state machine. Goldilocks difficulty calibration. Fail-forward mechanics — the patient deteriorates on wrong choices and rescue is required.",
  },
  {
    id: "goldilocks",
    name: "GOLDILOCKS",
    role: "Adaptive Difficulty",
    stage: "practice",
    description:
      "Tunes scenario complexity to the learner's current proficiency band — not too easy, not impossibly hard.",
  },
  {
    id: "cognita",
    name: "COGNITA",
    role: "Stealth Assessment",
    stage: "assess",
    description:
      "No explicit testing. Competency is inferred invisibly from every simulation action via Bayesian knowledge networks — the gold standard in psychometric science.",
  },
  {
    id: "persona",
    name: "PERSONA",
    role: "Psychometric Profile",
    stage: "assess",
    description:
      "Synthesises a Benner-stage proficiency profile after each session — Novice, Advanced Beginner, Competent, Proficient, Expert.",
  },
  {
    id: "lumina",
    name: "LUMINA",
    role: "Analytics Dashboard",
    stage: "assess",
    description:
      "Real-time competency analytics for unit leaders, educators, and chief nursing officers.",
  },
  {
    id: "resonance",
    name: "RESONANCE",
    role: "Formative Feedback",
    stage: "relearn",
    description:
      "Instant, evidence-anchored coaching that targets the specific gaps detected in the previous scene.",
  },
  {
    id: "continuum",
    name: "CONTINUUM",
    role: "Lifecycle Orchestrator",
    stage: "relearn",
    description:
      "Spaces, sequences, and back-harvests expert performance to seed better scenarios — the system gets smarter with every nurse it trains.",
  },
];

export const STAGES: { id: AgentStage; title: string; tagline: string; accent: string }[] = [
  {
    id: "learn",
    title: "Learn",
    tagline: "SOP → Scenario",
    accent: "teal",
  },
  {
    id: "practice",
    title: "Practice",
    tagline: "Simulate & Fail Safely",
    accent: "orange",
  },
  {
    id: "assess",
    title: "Assess",
    tagline: "Stealth Intelligence",
    accent: "gold",
  },
  {
    id: "relearn",
    title: "Relearn",
    tagline: "Reinforce & Advance",
    accent: "purple",
  },
];
