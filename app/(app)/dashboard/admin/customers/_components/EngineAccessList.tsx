"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  updateEngineAccess,
  type UpdateEngineAccessResult,
} from "../_actions";

export type EngineAccessRow = {
  slug: string;
  title: string;
  enabled: boolean;
  licenseTier: string;
  seats: number | null;
};

type Props = {
  customerId: string;
  rows: EngineAccessRow[];
};

const LICENSE_TIERS = ["pilot", "standard", "enterprise"] as const;

export function EngineAccessList({ customerId, rows }: Props) {
  const router = useRouter();
  const [local, setLocal] = useState<EngineAccessRow[]>(rows);
  const [savingSlug, setSavingSlug] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function save(slug: string, patch: Partial<EngineAccessRow>) {
    const next = local.map((r) => (r.slug === slug ? { ...r, ...patch } : r));
    setLocal(next);
    const row = next.find((r) => r.slug === slug)!;
    setSavingSlug(slug);
    setError(null);
    setNotice(null);
    try {
      const r: UpdateEngineAccessResult = await updateEngineAccess({
        customerId,
        engineSlug: slug,
        enabled: row.enabled,
        licenseTier: row.licenseTier,
        seats: row.seats,
      });
      if (r.status === "updated") {
        setNotice(`Saved ${row.title}.`);
        router.refresh();
      } else {
        setError(r.errors.join(" · "));
      }
    } finally {
      setSavingSlug(null);
    }
  }

  return (
    <div className="space-y-4">
      {(error || notice) && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            error
              ? "border-orange/25 bg-orange/5 text-orange"
              : "border-teal/25 bg-teal/5 text-ink-2"
          }`}
        >
          {error ?? notice}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-ink/10 bg-cream-light">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-ink/10 bg-ink/[0.02] text-left">
              <Th>Engine</Th>
              <Th>Enabled</Th>
              <Th>License tier</Th>
              <Th>Seats</Th>
              <Th className="text-right">Save</Th>
            </tr>
          </thead>
          <tbody>
            {local.map((r) => (
              <tr key={r.slug} className="border-b border-ink/5 last:border-0 align-top">
                <td className="px-4 py-3">
                  <div className="font-display text-ink">{r.title}</div>
                  <code className="font-mono text-[11px] text-ink-3">{r.slug}</code>
                </td>
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={r.enabled}
                    onChange={(e) =>
                      setLocal((cur) =>
                        cur.map((x) =>
                          x.slug === r.slug ? { ...x, enabled: e.target.checked } : x,
                        ),
                      )
                    }
                    className="h-4 w-4 rounded border-ink/20 text-teal"
                  />
                </td>
                <td className="px-4 py-3">
                  <select
                    value={r.licenseTier}
                    onChange={(e) =>
                      setLocal((cur) =>
                        cur.map((x) =>
                          x.slug === r.slug
                            ? { ...x, licenseTier: e.target.value }
                            : x,
                        ),
                      )
                    }
                    className={inputCls}
                  >
                    {LICENSE_TIERS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <input
                    type="number"
                    min={0}
                    value={r.seats ?? ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      setLocal((cur) =>
                        cur.map((x) =>
                          x.slug === r.slug
                            ? {
                                ...x,
                                seats: v === "" ? null : Number(v),
                              }
                            : x,
                        ),
                      );
                    }}
                    placeholder="—"
                    className={`${inputCls} w-24`}
                  />
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() =>
                      save(r.slug, {
                        enabled: r.enabled,
                        licenseTier: r.licenseTier,
                        seats: r.seats,
                      })
                    }
                    disabled={savingSlug === r.slug}
                    className="btn-primary"
                  >
                    {savingSlug === r.slug ? "Saving…" : "Save"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const inputCls =
  "rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm text-ink shadow-sm outline-none transition focus:border-teal focus:ring-2 focus:ring-teal/20";

function Th({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={`px-4 py-2 font-mono text-[10px] uppercase tracking-label text-ink-3 ${
        className ?? ""
      }`}
    >
      {children}
    </th>
  );
}
