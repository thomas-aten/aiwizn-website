import type { Metadata } from "next";
import Link from "next/link";
import { getCustomerContext } from "@/lib/customerContext";
import { createAdminClient } from "@/lib/supabase/admin";
import { listPendingProposals } from "@/lib/clinicalOverrideProposals";
import { ReviewQueue, type ReviewItem } from "./_components/ReviewQueue";

export const metadata: Metadata = {
  title: "Admin · Pending reviews",
  robots: { index: false, follow: false },
};

/**
 * Resolve proposer user-ids to a human label (email). Best-effort via the
 * service-role admin API — if the key is absent or a lookup fails we fall back
 * to a truncated id so the queue still renders.
 */
async function resolveProposers(
  userIds: string[],
): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  const unique = Array.from(new Set(userIds));
  if (unique.length === 0) return out;
  try {
    const admin = createAdminClient();
    await Promise.all(
      unique.map(async (id) => {
        const { data, error } = await admin.auth.admin.getUserById(id);
        if (!error && data.user) {
          out[id] = data.user.email ?? id;
        }
      }),
    );
  } catch (err) {
    console.warn(
      "[admin/reviews] proposer lookup unavailable:",
      err instanceof Error ? err.message : String(err),
    );
  }
  return out;
}

export default async function AdminReviewsPage() {
  const ctx = await getCustomerContext();
  if (ctx.status !== "ok") {
    // The admin layout handles anonymous/unassigned; backstop only.
    return null;
  }

  // Reviews is an admin-only surface (the interim reviewer role).
  if (!ctx.canEdit) {
    return (
      <div className="mx-auto max-w-md">
        <div className="card border-orange/20 p-8 text-center">
          <p className="font-mono text-[10px] uppercase tracking-label text-orange">
            ● Admins only
          </p>
          <h1 className="mt-3 font-display text-2xl text-ink">
            Clinical-override reviews
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-ink-2">
            Only a customer admin can review staged clinical overrides. You're
            signed in as <code className="font-mono text-xs">{ctx.role}</code>.
          </p>
          <Link
            href="/dashboard"
            className="btn-ghost mt-6 text-ink-3 hover:text-ink"
          >
            ← Workspace
          </Link>
        </div>
      </div>
    );
  }

  const proposals = await listPendingProposals(ctx.customerId);
  const proposers = await resolveProposers(proposals.map((p) => p.proposed_by));

  const items: ReviewItem[] = proposals.map((p) => ({
    id: p.id,
    engineSlug: p.engine_slug,
    proposedAt: p.proposed_at,
    proposerLabel: proposers[p.proposed_by] ?? `${p.proposed_by.slice(0, 8)}…`,
    overrides: p.proposed_clinical_overrides,
  }));

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label">Admin · Governance</p>
          <h1 className="mt-2 font-display text-3xl text-ink md:text-4xl">
            Pending reviews
          </h1>
          <p className="mt-2 max-w-prose text-sm text-ink-2">
            Clinical-override edits staged from the config editor wait here for
            medical-reviewer approval. Approving merges the override into a new
            published config version; rejecting discards it.
          </p>
        </div>
        <div className="text-right">
          <p className="font-mono text-[10px] uppercase tracking-label text-ink-3">
            Pending
          </p>
          <p className="font-display text-2xl text-ink">{items.length || "—"}</p>
          <Link
            href="/dashboard/admin/config"
            className="btn-ghost mt-1 text-ink-3 hover:text-ink"
          >
            ← Config
          </Link>
        </div>
      </div>

      <div className="mt-8">
        <ReviewQueue items={items} />
      </div>
    </div>
  );
}
