/**
 * OfferingMatrix — the four AIWIZN offerings, with maturity status + the
 * RUAIH "prepare for" framing applied consistently across public surfaces
 * (Platform, For Hospitals, For Schools).
 *
 * This component is purely presentational; it does NOT link to any tenant
 * demo URL (those stay gated to /demo, the channel-partner builder, and the
 * per-tenant cohort links). Its purpose is to make the four offerings + their
 * maturity legible on the public site without leaking demo URLs into the
 * indexable surface.
 *
 * RUAIH framing (locked, do not paraphrase loosely): AIWIZN PREPARES
 * organizations and people for AI-readiness standards including Joint
 * Commission RUAIH. It does NOT confer, certify, issue, or substitute for
 * RUAIH or any other accreditation. The "AI Literacy Index" badge in the
 * consumer tier is self-issued, not a certification.
 */

type Maturity = "live-validated" | "live-default-tenant" | "design-partner-sought";

type Offering = {
  id: string;
  name: string;
  index: string;
  blurb: string;
  audience: string;
  maturity: Maturity;
};

const OFFERINGS: readonly Offering[] = [
  {
    id: "clinical",
    name: "Clinical Engine",
    index: "NWI · Nurse Wisdom Index",
    blurb:
      "Scenario-based clinical-judgment assessment across the high-acuity trio — STEMI, stroke, sepsis. 13 decision nodes plus an unannounced retest. Produces an NWI score, 11 wisdom-domain profile, and decision-by-decision recap.",
    audience: "RNs · onboarding through specialty placement",
    maturity: "live-validated",
  },
  {
    id: "patient-care-onboarding",
    name: "Patient Care Onboarding",
    index: "PCRI · Patient Care Readiness Index",
    blurb:
      "Care-support staff (CNA / PCT / PCA) onboarding across 8 elements, 37 checkpoints, 12 decision nodes. Bedside scope-of-practice scaffolding for first-90-days care assistants.",
    audience: "CNAs · PCTs · PCAs",
    maturity: "live-validated",
  },
  {
    id: "ai-readiness",
    name: "AI Readiness Engine",
    index: "ARI · AI Readiness Index",
    blurb:
      "How staff actually reason about AI at the point of care — governance, bias recognition, failure-mode response, disclosure judgment, escalation discipline. 5 scenarios mapped to the Joint Commission RUAIH pillars. Prepares organizations and staff for RUAIH; does NOT issue Joint Commission RUAIH certification (only the Joint Commission can).",
    audience: "Clinical and non-clinical staff using AI tools",
    maturity: "live-default-tenant",
  },
  {
    id: "joint-commission-readiness",
    name: "Joint Commission Readiness",
    index: "JCRI · Joint Commission Readiness Index",
    blurb:
      "Train and assess against Joint Commission 2026 standards. The engine surface lives inside the dashboard so it inherits the tenant's protocol config and audit trail. Prepares organizations and staff for RUAIH and adjacent JC standards; does NOT issue Joint Commission certification.",
    audience: "Hospital staff · accreditation-readiness teams",
    maturity: "live-default-tenant",
  },
];

const MATURITY_LABEL: Record<Maturity, string> = {
  "live-validated": "● Live · validated",
  "live-default-tenant": "● Live · default tenant",
  "design-partner-sought": "○ Architecturally ready · design partner sought",
};

const MATURITY_DOT_CLASS: Record<Maturity, string> = {
  "live-validated": "text-teal-dark",
  "live-default-tenant": "text-teal-dark",
  "design-partner-sought": "text-ink-3",
};

export function OfferingMatrix({
  eyebrow = "The offerings",
  title = "Four engines · one platform.",
  intro = "AIWIZN ships as a set of composable engines. Each one is built on the same multi-agent simulation + stealth-assessment spine; what changes is the scenario library and the index it produces. Maturity is shown honestly per engine.",
}: {
  eyebrow?: string;
  title?: string;
  intro?: string;
} = {}) {
  return (
    <section className="bg-cream-light">
      <div className="container py-16 md:py-24">
        <p className="label">{eyebrow}</p>
        <h2 className="mt-4 max-w-3xl font-display text-3xl leading-tight text-ink md:text-5xl">
          {title}
        </h2>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ink-2">
          {intro}
        </p>

        <div className="mt-12 grid gap-5 md:grid-cols-2">
          {OFFERINGS.map((o) => (
            <article key={o.id} className="card p-7">
              <p
                className={`font-mono text-[10px] uppercase tracking-label ${MATURITY_DOT_CLASS[o.maturity]}`}
              >
                {MATURITY_LABEL[o.maturity]}
              </p>
              <h3 className="mt-3 font-display text-2xl text-ink md:text-3xl">
                {o.name}
              </h3>
              <p className="mt-2 font-mono text-[10px] uppercase tracking-label text-ink-3">
                {o.index}
              </p>
              <p className="mt-4 text-sm leading-relaxed text-ink-2">
                {o.blurb}
              </p>
              <p className="mt-5 font-mono text-[10px] uppercase tracking-label text-ink-3">
                {o.audience}
              </p>
            </article>
          ))}
        </div>

        <p className="mt-10 max-w-3xl text-xs leading-relaxed text-ink-3">
          <span className="font-mono text-[10px] uppercase tracking-label text-ink-3">
            On standards
          </span>
          {" — "}
          AIWIZN prepares organizations and people for AI-readiness and
          accreditation standards including Joint Commission RUAIH. AIWIZN does
          not confer, certify, issue, or substitute for Joint Commission
          certification — only the Joint Commission can issue RUAIH.
        </p>
      </div>
    </section>
  );
}
