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
 * server-side as a httpOnly cookie via {@link setActiveCustomer} and the page
 * is refreshed so the new context (nav, admin gates, config) is reflected
 * everywhere on the next render.
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
      router.refresh();
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
