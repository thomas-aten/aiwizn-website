"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ClinicalOverridesConfig } from "@/lib/protocolConfig";
import { approveProposal, rejectProposal, type ReviewResult } from "../_actions";

export type ReviewItem = {
  id: string;
  engineSlug: string;
  proposedAt: string;
  proposerLabel: string;
  overrides: ClinicalOverridesConfig;
};

const OVERRIDE_FIELDS: { key: keyof ClinicalOverridesConfig; label: string }[] = [
  { key: "additional_contraindications", label: "Additional contraindications" },
  { key: "additional_inclusion_criteria", label: "Additional inclusion criteria" },
  { key: "sepsis_notes", label: "Sepsis notes" },
];

export function ReviewQueue({ items }: { items: ReviewItem[] }) {
  if (items.length === 0) {
    return (
      <div className="card p-10 text-center">
        <p className="font-mono text-[10px] uppercase tracking-label text-ink-3">
          All clear
        </p>
        <h2 className="mt-2 font-display text-xl text-ink">
          No pending reviews
        </h2>
        <p className="mt-2 text-sm text-ink-2">
          Staged clinical-override edits will appear here for approval.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {items.map((item) => (
        <ProposalCard key={item.id} item={item} />
      ))}
    </div>
  );
}

function ProposalCard({ item }: { item: ReviewItem }) {
  const router = useRouter();
  const [notes, setNotes] = useState("");
  const [pending, setPending] = useState<"approve" | "reject" | null>(null);
  const [result, setResult] = useState<ReviewResult | null>(null);

  async function run(action: "approve" | "reject") {
    setPending(action);
    setResult(null);
    try {
      const r =
        action === "approve"
          ? await approveProposal(item.id, notes)
          : await rejectProposal(item.id, notes);
      setResult(r);
      if (r.status === "approved" || r.status === "rejected") {
        router.refresh();
      }
    } finally {
      setPending(null);
    }
  }

  const done = result?.status === "approved" || result?.status === "rejected";
  const busy = pending !== null;

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-ink/10 px-5 py-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-label text-ink-3">
            Proposed override · {item.engineSlug}
          </p>
          <h3 className="mt-0.5 font-display text-lg text-ink">
            {item.proposerLabel}
          </h3>
        </div>
        <p className="font-mono text-[11px] text-ink-3">
          {formatTimestamp(item.proposedAt)}
        </p>
      </div>

      <div className="space-y-3 px-5 py-4">
        {OVERRIDE_FIELDS.map((f) => {
          const value = item.overrides?.[f.key] ?? "";
          return (
            <div key={f.key}>
              <p className="mb-1 font-mono text-[11px] uppercase tracking-label text-ink-2">
                {f.label}
              </p>
              {value.trim() ? (
                <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg border border-ink/10 bg-ink/[0.02] px-3 py-2 text-xs text-ink-2">
                  {value}
                </pre>
              ) : (
                <p className="text-xs italic text-ink-3">— empty —</p>
              )}
            </div>
          );
        })}
      </div>

      {!done && (
        <div className="border-t border-ink/10 px-5 py-4">
          <label className="mb-1 block font-mono text-[11px] uppercase tracking-label text-ink-2">
            Reviewer notes (optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={busy}
            rows={2}
            placeholder="Rationale for the decision — stored on the proposal and audit log."
            className="w-full resize-y rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm text-ink shadow-sm outline-none transition focus:border-teal focus:ring-2 focus:ring-teal/20 disabled:cursor-not-allowed disabled:bg-ink/5"
          />
          <div className="mt-3 flex items-center justify-end gap-2">
            <button
              type="button"
              className="btn-ghost text-orange hover:text-orange"
              onClick={() => run("reject")}
              disabled={busy}
            >
              {pending === "reject" ? "Rejecting…" : "Reject"}
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={() => run("approve")}
              disabled={busy}
            >
              {pending === "approve" ? "Approving…" : "Approve & publish"}
            </button>
          </div>
        </div>
      )}

      {result && (
        <div className="border-t border-ink/10 px-5 py-4">
          <ResultNotice result={result} />
        </div>
      )}
    </div>
  );
}

function ResultNotice({ result }: { result: ReviewResult }) {
  if (result.status === "approved") {
    return (
      <Banner tone="success">
        Approved — merged into <strong>v{result.version}</strong>. Engines pick
        up the new config on next load.
      </Banner>
    );
  }
  if (result.status === "rejected") {
    return <Banner tone="warn">Rejected. No config version was published.</Banner>;
  }
  return (
    <Banner tone="warn">
      <strong>Could not complete.</strong>
      <ul className="mt-1 list-disc pl-5">
        {result.errors.map((e, i) => (
          <li key={i}>{e}</li>
        ))}
      </ul>
    </Banner>
  );
}

function Banner({
  tone,
  children,
}: {
  tone: "warn" | "success";
  children: React.ReactNode;
}) {
  const cls = {
    warn: "border-orange/25 bg-orange/5 text-ink-2",
    success: "border-teal/30 bg-teal/10 text-ink",
  }[tone];
  return (
    <div className={`rounded-xl border px-4 py-3 text-sm leading-relaxed ${cls}`}>
      {children}
    </div>
  );
}

/** Stable, locale-independent timestamp (avoids hydration drift). */
function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toISOString().slice(0, 16).replace("T", " ") + " UTC";
}
