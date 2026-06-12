"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setActiveCustomer } from "@/app/(app)/_actions";
import type { Membership } from "@/lib/customerContext";

type Props = {
  memberships: Membership[];
  activeCustomerId: string;
};

/**
 * Header dropdown that lets a multi-membership user switch which customer
 * workspace they're currently acting in. The active selection is persisted
 * server-side as a httpOnly cookie via {@link setActiveCustomer}; we then
 * force a full reload so every server-rendered surface (layout nav, admin
 * gates, /admin/config form bound to the active tenant's protocol_configs)
 * picks up the new cookie context. `router.refresh()` alone was insufficient
 * — the React Server Components cache held the prior context until a hard
 * reload landed (Sprint 7.2 fix: switcher only worked on Ctrl+R).
 *
 * The parent layout decides whether to render this at all — a single-
 * membership user (Diane, Robin) never sees the switcher and their existing
 * UX is unchanged.
 */
export function CustomerSwitcher({ memberships, activeCustomerId }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value;
    if (!next || next === activeCustomerId) return;
    setError(null);
    startTransition(async () => {
      const res = await setActiveCustomer(next);
      if ("error" in res) {
        setError(res.error);
        return;
      }
      // Hard reload: revalidatePath + router.refresh() leave the RSC cache
      // partially stale on this flow; window.location.reload() guarantees
      // the next request reads the just-written cookie and re-renders every
      // server surface with the new active customer.
      if (typeof window !== "undefined") window.location.reload();
      else router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-2">
      <label
        htmlFor="customer-switcher"
        className="hidden font-mono text-[10px] uppercase tracking-label text-ink-3 lg:inline"
      >
        Workspace
      </label>
      <select
        id="customer-switcher"
        value={activeCustomerId}
        onChange={onChange}
        disabled={pending}
        aria-label="Active customer workspace"
        className="rounded-md border border-ink/15 bg-cream-light px-2 py-1 font-mono text-[11px] uppercase tracking-label text-ink hover:border-ink/30 focus:outline-none focus:ring-2 focus:ring-orange/40 disabled:opacity-60"
      >
        {memberships.map((m) => (
          <option key={m.customerId} value={m.customerId}>
            {m.customerName}
          </option>
        ))}
      </select>
      {error && (
        <span
          role="alert"
          className="font-mono text-[10px] uppercase tracking-label text-orange"
        >
          {error}
        </span>
      )}
    </div>
  );
}
